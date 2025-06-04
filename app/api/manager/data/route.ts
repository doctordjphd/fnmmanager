import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get("date") || "2025-06-13"

    // Get tables with their reservations
    const tablesData = await sql`
      SELECT 
        t.id,
        t.table_number,
        t.event_date,
        t.max_players,
        t.current_players,
        COALESCE(
          JSON_AGG(
            CASE WHEN r.id IS NOT NULL THEN
              JSON_BUILD_OBJECT(
                'id', r.id,
                'customer_name', r.customer_name,
                'customer_email', r.customer_email,
                'seat_count', r.seat_count,
                'amount_paid', r.amount_paid,
                'paypal_transaction_id', r.paypal_transaction_id
              )
            END
          ) FILTER (WHERE r.id IS NOT NULL),
          '[]'
        ) as reservations
      FROM event_tables t
      LEFT JOIN reservations r ON t.id = r.table_assignment AND r.event_date = t.event_date
      WHERE t.event_date = ${date}
      GROUP BY t.id, t.table_number, t.event_date, t.max_players, t.current_players
      ORDER BY t.table_number
    `

    // Get unassigned reservations
    const unassignedData = await sql`
      SELECT *
      FROM reservations
      WHERE event_date = ${date} AND table_assignment IS NULL
      ORDER BY created_at ASC
    `

    // Get stats
    const statsData = await sql`
      SELECT 
        COUNT(*) as total_reservations,
        COALESCE(SUM(amount_paid), 0) as total_revenue,
        COALESCE(SUM(seat_count), 0) as total_players
      FROM reservations
      WHERE event_date = ${date}
    `

    return NextResponse.json({
      tables: tablesData,
      unassigned: unassignedData,
      stats: {
        totalReservations: Number.parseInt(statsData[0].total_reservations),
        totalRevenue: Number.parseFloat(statsData[0].total_revenue),
        totalPlayers: Number.parseInt(statsData[0].total_players),
      },
    })
  } catch (error) {
    console.error("Data fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 })
  }
}
