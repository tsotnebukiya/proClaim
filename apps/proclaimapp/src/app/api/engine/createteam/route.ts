import { env } from "@/env";
import { db } from "@/server/db";
import { NextRequest, NextResponse } from "next/server";
import { deployContract, depositoryContract, wallet } from "proclaim";
import { name } from "proclaim/depositoryFunctions";
import { sendAndConfirmTransaction } from "thirdweb";

import { z } from "zod";

const schema = z.object({
  market: z.string(),
  account: z.number(),
});

export async function POST(req: NextRequest) {
  const object: unknown = await req.json();

  try {
    await name({ contract: depositoryContract });
    const { account, market } = schema.parse(object);
    const transaction = deployContract({
      account,
      market,
      publicKey: env.PROCHAIN_PUBLIC_KEY,
    });
    const { contractAddress } = await sendAndConfirmTransaction({
      transaction: transaction,
      account: wallet,
    });
    const response = await db.team.create({
      data: {
        account,
        market,
        contractAddress: contractAddress!,
      },
    });
    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    const err = error as { message?: string };
    const errorMessage = err.message ? err.message : "An error occured.";
    return NextResponse.json(
      { message: "Error", error: errorMessage },
      { status: 500 },
    );
  }
}
