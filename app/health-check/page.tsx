import type { Metadata } from "next";
import HealthCheck from "./HealthCheck";

const URL = "https://www.operza.in/health-check";

// Metadata only. The assessment itself is still the factory-scoped 2026-05
// version; broadening its questions and results is a later change. What this
// copy must not do is describe Operza as inventory and production software.
const DESCRIPTION =
  "Eight questions and no signup. See where your factory's record keeping is costing time and materials. From Operza, manufacturing software for Indian factories.";

const SOCIAL_DESCRIPTION =
  "Eight questions, no signup. A quick look at where your factory's record keeping is costing you time and materials.";

export const metadata: Metadata = {
  title: "Manufacturing Health Check",
  description: DESCRIPTION,
  alternates: { canonical: URL },
  openGraph: {
    type: "website",
    url: URL,
    title: "Manufacturing Health Check | Operza",
    description: SOCIAL_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: "Manufacturing Health Check | Operza",
    description: SOCIAL_DESCRIPTION,
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
