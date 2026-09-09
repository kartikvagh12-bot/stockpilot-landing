import type { Metadata } from "next";
import HealthCheck from "./HealthCheck";

const URL = "https://www.operza.in/health-check";

// The assessment is factory-operations scoped: it asks how visible and how well
// recorded materials, production and finished goods are, and nothing about the
// books. The metadata says the same, so a search result is not a wider promise
// than the page keeps.
const DESCRIPTION =
  "Eight questions, no signup. Check how visible your materials, production and finished-goods records are, and see where your operation still depends on manual checks.";

const SOCIAL_DESCRIPTION =
  "Eight questions, no signup. See how visible your materials, production and finished-goods records are.";

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
  themeColor: "#05070f",
  width: "device-width",
  initialScale: 1,
};

export default function HealthCheckPage() {
  return <HealthCheck />;
}
