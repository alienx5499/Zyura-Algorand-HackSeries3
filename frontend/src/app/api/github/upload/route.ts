import { NextRequest, NextResponse } from "next/server";
import { githubNftPath } from "@/lib/github-metadata-paths";
import { shortenUrlForAsaBase } from "@/lib/shorten-url-for-asa";

export async function POST(request: NextRequest) {
  try {
    const { content, filePath, message } = await request.json();

    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const GITHUB_REPO =
      process.env.GITHUB_NFT_REPO ||
      process.env.GITHUB_METADATA_REPO ||
      process.env.GITHUB_REPO ||
      "alienx5499/Zyura-Algorand-HackSeries3-MetaData";
    const GITHUB_BRANCH =
      process.env.GITHUB_NFT_BRANCH || process.env.GITHUB_BRANCH || "main";
    const GITHUB_PATH = githubNftPath();

    if (!GITHUB_TOKEN || !GITHUB_REPO) {
      return NextResponse.json(
        {
          error:
            "GitHub configuration not set. Please set GITHUB_TOKEN and GITHUB_METADATA_REPO (or GITHUB_NFT_REPO) in your .env file.",
        },
        { status: 500 },
      );
    }

    const contentBase64 = Buffer.from(content, "utf8").toString("base64");
    const fullPath = `${GITHUB_PATH}/${filePath}`;

    const checkUrl = `https://api.github.com/repos/${GITHUB_REPO}/contents/${fullPath}?ref=${GITHUB_BRANCH}`;
    let existingSha: string | null = null;

    try {
      const checkResponse = await fetch(checkUrl, {
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          Accept: "application/vnd.github.v3+json",
        },
      });
      if (checkResponse.ok) {
        const existingFile = await checkResponse.json();
        existingSha = existingFile.sha;
      }
    } catch {
      /* new file */
    }

    const uploadUrl = `https://api.github.com/repos/${GITHUB_REPO}/contents/${fullPath}`;
    const uploadBody: Record<string, unknown> = {
      message,
      content: contentBase64,
      branch: GITHUB_BRANCH,
    };

    if (existingSha) {
      uploadBody.sha = existingSha;
    }

    const response = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        "Content-Type": "application/json",
        Accept: "application/vnd.github.v3+json",
      },
      body: JSON.stringify(uploadBody),
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json(
        { error: `Failed to upload: ${response.status} ${error}` },
        { status: response.status },
      );
    }

    const rawUrl = `https://raw.githubusercontent.com/${GITHUB_REPO}/${GITHUB_BRANCH}/${fullPath}`;

    let finalUrl: string;
    const isPolicyJson = filePath.endsWith("policy.json");

    if (isPolicyJson) {
      try {
        finalUrl = await shortenUrlForAsaBase(rawUrl);
      } catch (e) {
        const message = e instanceof Error ? e.message : "URL shorten failed";
        return NextResponse.json(
          {
            error: message,
            details:
              "The app shortens your GitHub link so it fits on-chain (96 characters). If this keeps failing, try another network or turn off VPN.",
          },
          { status: 500 },
        );
      }
    } else {
      finalUrl = rawUrl;
    }

    return NextResponse.json({ url: finalUrl, rawUrl });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
