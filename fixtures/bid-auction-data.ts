import { BidAuctionFormData } from "../pages/backoffice/BidAuctionFormPage";
import { nextValidAuctionDates } from "./auction-data";

export function generateBidAuctionData(location: string = "JBAP"): BidAuctionFormData {
  const { start, end } = nextValidAuctionDates();
  return {
    location,
    startDateTime: start,
    endDateTime: end,
  };
}
