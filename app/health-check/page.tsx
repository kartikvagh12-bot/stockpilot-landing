import type { Metadata } from "next";
import HealthCheck from "./HealthCheck";

const URL = "https://www.operza.in/health-check";

export const metadata: Metadata = {
  title: "Manufacturing Health Check",
  description:
    "Assess your manufacturing inventory and production workflow efficiency with Operza's operational health check. Discover blind spots in 60 seconds.",
  alternates: { canonical: URL },
  openGraph: {
    type: "website",
    url: URL,
    title: "Manufacturing Health Check | Operza",
    description:
      "Discover the operational blind spots quietly costing your factory time, materials, and margin.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Manufacturing Health Check | Operza",
    description:
      "Discover the operational blind spots quietly costing your factory time, materials, and margin.",
  },
};

export const viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
};

export default function HealthCheckPage() {
  return <HealthCheck />;
}
