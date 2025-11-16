import { collection, addDoc, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "../config/firebase";
import { addDonation as addDonationToFirebase, getRecentDonations as getFirebaseDonations } from "./firebaseService";

export interface DonationData {
  name: string;
  email?: string;
  amount: number;
  message?: string;
  timestamp: Date;
  anonymous: boolean;
  userId?: string;
}

export const addDonation = async (donationData: DonationData) => {
  try {
    // Use the enhanced function from firebaseService
    return await addDonationToFirebase({
      userId: donationData.anonymous ? undefined : donationData.userId,
      amount: donationData.amount,
      shelterName: "General Donation",
      timestamp: new Date(),
      message: donationData.message,
      anonymous: donationData.anonymous
    });
  } catch (error) {
    console.error("Error adding donation: ", error);
    throw error;
  }
};

export const getRecentDonations = async (limit_count: number = 5) => {
  return await getFirebaseDonations(limit_count);
};