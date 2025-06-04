"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Trash2, Users, Calendar, DollarSign } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface Reservation {
  id: number
  paypal_transaction_id: string
  customer_name: string
  customer_email: string
  event_date: string
  seat_count: number
  amount_paid: number
  table_assignment: number | null
  created_at: string
}

interface Table {
  id: number
  table_number: number
  event_date: string
  max_players: number
  current_players: number
  reservations: Reservation[]
}

export default function ManagerDashboard() {
  const [tables, setTables] = useState<Table[]>([])
  const [unassignedReservations, setUnassignedReservations] = useState<Reservation[]>([])
  const [selectedDate, setSelectedDate] = useState("2025-06-13")
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalReservations: 0,
    totalRevenue: 0,
    totalPlayers: 0,
  })

  useEffect(() => {
    fetchData()
  }, [selectedDate])

  const fetchData = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/manager/data?date=${selectedDate}`)
      const data = await response.json()
      setTables(data.tables)
      setUnassignedReservations(data.unassigned)
      setStats(data.stats)
    } catch (error) {
      console.error("Failed to fetch data:", error)
    }
    setLoading(false)
  }

  const removePlayerFromTable = async (reservationId: number) => {
    try {
      const response = await fetch("/api/manager/remove-player", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reservationId }),
      })

      if (response.ok) {
        fetchData() // Refresh data
      }
    } catch (error) {
      console.error("Failed to remove player:", error)
    }
  }

  const assignToTable = async (reservationId: number, tableId: number) => {
    try {
      const response = await fetch("/api/manager/assign-table", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reservationId, tableId }),
      })

      if (response.ok) {
        fetchData() // Refresh data
      }
    } catch (error) {
      console.error("Failed to assign to table:", error)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">MTG Event Manager</h1>
        <div className="flex items-center gap-4">
          <label htmlFor="date-select" className="font-medium">
            Event Date:
          </label>
          <select
            id="date-select"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="border rounded px-3 py-2"
          >
            <option value="2025-06-13">Friday, June 13, 2025</option>
            <option value="2025-06-20">Friday, June 20, 2025</option>
            <option value="2025-06-27">Friday, June 27, 2025</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reservations</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalReservations}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Players</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPlayers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Unassigned Reservations */}
      {unassignedReservations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Unassigned Reservations</CardTitle>
            <CardDescription>Players waiting for table assignment</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {unassignedReservations.map((reservation) => (
                <div key={reservation.id} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <div className="font-medium">{reservation.customer_name}</div>
                    <div className="text-sm text-muted-foreground">
                      {reservation.seat_count} seat{reservation.seat_count > 1 ? "s" : ""} - ${reservation.amount_paid}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {tables.map((table) => (
                      <Button
                        key={table.id}
                        size="sm"
                        variant="outline"
                        disabled={table.current_players + reservation.seat_count > table.max_players}
                        onClick={() => assignToTable(reservation.id, table.id)}
                      >
                        Table {table.table_number}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tables */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tables.map((table) => (
          <Card key={table.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Table {table.table_number}
                <Badge variant={table.current_players === table.max_players ? "default" : "secondary"}>
                  {table.current_players}/{table.max_players}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {table.reservations.map((reservation) => (
                  <div key={reservation.id} className="flex items-center justify-between p-2 bg-muted rounded">
                    <div>
                      <div className="font-medium text-sm">{reservation.customer_name}</div>
                      <div className="text-xs text-muted-foreground">
                        {reservation.seat_count} seat{reservation.seat_count > 1 ? "s" : ""}
                      </div>
                    </div>
                    <Button size="sm" variant="destructive" onClick={() => removePlayerFromTable(reservation.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                {table.current_players === 0 && (
                  <div className="text-center text-muted-foreground text-sm py-4">No players assigned</div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {tables.length === 0 && (
        <Alert>
          <AlertDescription>
            No tables found for this date. Tables will be created automatically when reservations are made.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
