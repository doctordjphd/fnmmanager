import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    const { reservationId } = await request.json()

    // Get reservation details
    const reservation = await sql`
      SELECT * FROM reservations WHERE id = ${reservationId}
    `

    if (reservation.length === 0) {
      return NextResponse.json({ error: "Reservation not found" }, { status: 404 })
    }

    const tableId = reservation[0].table_assignment
    const seatCount = reservation[0].seat_count

    // Remove from table
    await sql`
      UPDATE reservations 
      SET table_assignment = NULL 
      WHERE id = ${reservationId}
    `

    // Update table player count
    if (tableId) {
      await sql`
        UPDATE event_tables 
        SET current_players = current_players - ${seatCount}
        WHERE id = ${tableId}
      `
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Remove player error:", error)
    return NextResponse.json({ error: "Failed to remove player" }, { status: 500 })
  }
}
