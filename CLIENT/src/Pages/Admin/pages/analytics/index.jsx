import React from "react";
import { Grid, Card, CardContent, Typography, Box } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { useQuery } from "@tanstack/react-query";

const StatCard = ({ title, value }) => (
  <Card elevation={1} sx={{ minHeight: 100 }}>
    <CardContent>
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        {title}
      </Typography>
      <Typography variant="h5" fontWeight="bold">
        {value}
      </Typography>
    </CardContent>
  </Card>
);

const API_BASE = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";
const fetcher = (path) => {
  const url = `${API_BASE}${path}`;
  const token = localStorage.getItem("admin-token");
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  return fetch(url, { credentials: "include", headers }).then(async (res) => {
    const json = await res.json().catch(() => null);
    console.log("[Analytics fetch]", url, res.status, json);
    return json;
  });
};

const columns = [
  { field: "date", headerName: "Date", flex: 1 },
  { field: "eventName", headerName: "Event", flex: 1 },
  { field: "teamName", headerName: "Team", flex: 1 },
  { field: "entryFee", headerName: "Entry Fee", type: "number", flex: 1 },
  { field: "type", headerName: "Type", flex: 1 },
];

const AnalyticsPage = () => {
  const { data: visitors } = useQuery({
    queryKey: ["liveVisitors"],
    queryFn: () => fetcher("/api/admin/analytics/live-visitors"),
  });

  const { data: daySales } = useQuery({
    queryKey: ["ticketSalesDay"],
    queryFn: () => fetcher("/api/admin/analytics/ticket-sales?range=day"),
  });

  const { data: weekSales } = useQuery({
    queryKey: ["ticketSalesWeek"],
    queryFn: () => fetcher("/api/admin/analytics/ticket-sales?range=week"),
  });

  const { data: monthSales } = useQuery({
    queryKey: ["ticketSalesMonth"],
    queryFn: () => fetcher("/api/admin/analytics/ticket-sales?range=month"),
  });

  const { data: revenue } = useQuery({
    queryKey: ["revenueMonth"],
    queryFn: () => fetcher("/api/admin/analytics/revenue?range=month"),
  });

  const { data: verif } = useQuery({
    queryKey: ["verification"],
    queryFn: () => fetcher("/api/admin/analytics/verification-stats"),
  });

  const { data: listDay } = useQuery({
    queryKey: ["listDay"],
    queryFn: () => fetcher("/api/admin/analytics/ticket-sales-list?range=day"),
  });
  const { data: listWeek } = useQuery({
    queryKey: ["listWeek"],
    queryFn: () => fetcher("/api/admin/analytics/ticket-sales-list?range=week"),
  });
  const { data: listMonth } = useQuery({
    queryKey: ["listMonth"],
    queryFn: () => fetcher("/api/admin/analytics/ticket-sales-list?range=month"),
  });

  const renderTable = (rows = []) => (
    <Box sx={{ height: 300, width: "100%", my: 2 }}>
      <DataGrid
        rows={rows.map((r, idx) => ({ id: idx, ...r }))}
        columns={columns}
        pageSize={5}
        rowsPerPageOptions={[5]}
        density="compact"
        disableSelectionOnClick
      />
    </Box>
  );

  return (
    <div className="space-y-6">
      <Typography variant="h4" gutterBottom>
        Analytics Overview
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Live Visitors"
            value={visitors?.data?.liveVisitors ?? "-"}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Tickets (Today)" value={daySales?.data?.sold ?? "-"} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Tickets (7d)" value={weekSales?.data?.sold ?? "-"} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Tickets (Month)" value={monthSales?.data?.sold ?? "-"} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Gross Revenue" value={revenue?.data?.gross ?? "-"} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Net Revenue" value={revenue?.data?.net ?? "-"} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Aadhaar Verified" value={verif?.data?.verified ?? "-"} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Unverified" value={verif?.data?.unverified ?? "-"} />
        </Grid>
      </Grid>

      <Typography variant="h6" sx={{ mt: 4 }}>
        Today
      </Typography>
      {renderTable(listDay?.data?.list)}

      <Typography variant="h6" sx={{ mt: 4 }}>
        Last 7 Days
      </Typography>
      {renderTable(listWeek?.data?.list)}

      <Typography variant="h6" sx={{ mt: 4 }}>
        This Month
      </Typography>
      {renderTable(listMonth?.data?.list)}
    </div>
  );
};

export default AnalyticsPage;
