import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    const { reservationId, tableId } = await request.json()

    // Get reservation details
    const reservation = await sql`
      SELECT * FROM reservations WHERE id = ${reservationId}
    `

    if (reservation.length === 0) {
      return NextResponse.json({ error: "Reservation not found" }, { status: 404 })
    }

    const seatCount = reservation[0].seat_count

    // Check if table has space
    const table = await sql`
      SELECT * FROM event_tables WHERE id = ${tableId}
    `

    if (table.length === 0) {
      return NextResponse.json({ error: "Table not found" }, { status: 404 })
    }

    if (table[0].current_players + seatCount > table[0].max_players) {
      return NextResponse.json({ error: "Not enough space at table" }, { status: 400 })
    }

    // Assign to table
    await sql`
      UPDATE reservations 
      SET table_assignment = ${tableId}
      WHERE id = ${reservationId}
    `

    // Update table player count
    await sql`
      UPDATE event_tables 
      SET current_players = current_players + ${seatCount}
      WHERE id = ${tableId}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Assign table error:", error)
    return NextResponse.json({ error: "Failed to assign to table" }, { status: 500 })
  }
}
