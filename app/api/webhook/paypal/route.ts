import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

// Verify PayPal webhook signature
function verifyPayPalSignature(payload: string, signature: string, webhookId: string): boolean {
  // In production, you should verify the PayPal webhook signature
  // For now, we'll skip verification for development
  return true
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get("paypal-transmission-sig")
    const webhookId = process.env.PAYPAL_WEBHOOK_ID

    // Verify signature (simplified for demo)
    if (!verifyPayPalSignature(body, signature || "", webhookId || "")) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }

    const event = JSON.parse(body)

    // Handle payment completion
    if (event.event_type === "PAYMENT.SALE.COMPLETED") {
      const payment = event.resource
      const transactionId = payment.id
      const amount = Number.parseFloat(payment.amount.total)
      const currency = payment.amount.currency

      // Extract customer info from PayPal data
      const customerEmail = payment.payer.payer_info.email
      const customerName = `${payment.payer.payer_info.first_name} ${payment.payer.payer_info.last_name}`

      // Parse item details to get event info
      const itemName = payment.item_list?.items?.[0]?.name || ""
      const eventDateMatch = itemName.match(/(\d{4}-\d{2}-\d{2})/)
      const seatCountMatch = itemName.match(/(\d+) Seat/)

      const eventDate = eventDateMatch ? eventDateMatch[1] : "2025-06-13"
      const seatCount = seatCountMatch ? Number.parseInt(seatCountMatch[1]) : 1

      // Store reservation in database
      await sql`
        INSERT INTO reservations (
          paypal_transaction_id, 
          customer_name, 
          customer_email, 
          event_date, 
          seat_count, 
          amount_paid,
          payment_status
        ) VALUES (
          ${transactionId},
          ${customerName},
          ${customerEmail},
          ${eventDate},
          ${seatCount},
          ${amount},
          'completed'
        )
        ON CONFLICT (paypal_transaction_id) DO NOTHING
      `

      // Auto-assign to table if possible
      await autoAssignToTable(transactionId, eventDate, seatCount)

      console.log(`Payment processed: ${customerName} - ${seatCount} seats for ${eventDate}`)
    }

    return NextResponse.json({ status: "success" })
  } catch (error) {
    console.error("Webhook error:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}

async function autoAssignToTable(transactionId: string, eventDate: string, seatCount: number) {
  try {
    // Find available table with enough space
    const availableTables = await sql`
      SELECT * FROM event_tables 
      WHERE event_date = ${eventDate} 
      AND (max_players - current_players) >= ${seatCount}
      ORDER BY table_number ASC
    `

    let tableId: number

    if (availableTables.length > 0) {
      // Use existing table
      tableId = availableTables[0].id
    } else {
      // Create new table
      const newTableNumber = await getNextTableNumber(eventDate)
      const newTable = await sql`
        INSERT INTO event_tables (table_number, event_date, current_players)
        VALUES (${newTableNumber}, ${eventDate}, 0)
        RETURNING id
      `
      tableId = newTable[0].id
    }

    // Assign reservation to table
    await sql`
      UPDATE reservations 
      SET table_assignment = ${tableId}
      WHERE paypal_transaction_id = ${transactionId}
    `

    // Update table player count
    await sql`
      UPDATE event_tables 
      SET current_players = current_players + ${seatCount}
      WHERE id = ${tableId}
    `
  } catch (error) {
    console.error("Auto-assignment error:", error)
  }
}

async function getNextTableNumber(eventDate: string): Promise<number> {
  const result = await sql`
    SELECT COALESCE(MAX(table_number), 0) + 1 as next_number
    FROM event_tables 
    WHERE event_date = ${eventDate}
  `
  return result[0].next_number
}
