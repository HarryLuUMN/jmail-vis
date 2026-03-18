#!/usr/bin/env -S uv run
# /// script
# requires-python = ">=3.11"
# dependencies = [
#   "matplotlib>=3.9",
#   "pandas>=2.2",
#   "pyarrow>=16.1",
# ]
# ///

from __future__ import annotations

import json
import re
import urllib.request
from pathlib import Path

import matplotlib.pyplot as plt
import pandas as pd


DATA_URL = "https://data.jmail.world/v1/emails-slim.parquet"
ROOT = Path(__file__).resolve().parent
DATA_DIR = ROOT / "data"
OUTPUT_DIR = ROOT / "outputs" / "jmail_eda"
DATA_PATH = DATA_DIR / "jmail_emails_slim.parquet"


def ensure_dataset() -> Path:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    if DATA_PATH.exists():
        return DATA_PATH
    request = urllib.request.Request(
        DATA_URL,
        headers={"User-Agent": "Mozilla/5.0 (compatible; jmail-vis/1.0)"},
    )
    with urllib.request.urlopen(request) as response, DATA_PATH.open("wb") as handle:
        handle.write(response.read())
    return DATA_PATH


def parse_recipient_list(value: object) -> list[str]:
    if value in (None, "", "null"):
        return []
    if isinstance(value, list):
        items = value
    else:
        try:
            items = json.loads(value)
        except (TypeError, json.JSONDecodeError):
            return []
    return [str(item).strip() for item in items if str(item).strip()]


def normalize_contact(value: str) -> str:
    match = re.search(r"<([^<>]+)>", value)
    if match:
        return match.group(1).strip().lower()
    cleaned = " ".join(value.replace('"', "").split()).strip().lower()
    return cleaned


def build_recipient_series(df: pd.DataFrame) -> pd.Series:
    recipients: list[str] = []
    for column in ["to_recipients", "cc_recipients", "bcc_recipients"]:
        for value in df[column].dropna():
            recipients.extend(normalize_contact(item) for item in parse_recipient_list(value))
    return pd.Series(recipients, name="recipient")


def write_summary(
    df: pd.DataFrame,
    top_senders: pd.Series,
    top_recipients: pd.Series,
    monthly_counts: pd.Series,
    promo_share: float,
) -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    summary_path = OUTPUT_DIR / "eda_summary.md"
    start = df["sent_at_ts"].min()
    end = df["sent_at_ts"].max()
    lines = [
        "# Jmail EDA Summary",
        "",
        f"- Total emails: {len(df):,}",
        f"- Unique threads: {df['doc_id'].nunique():,}",
        f"- Unique senders: {df['sender_normalized'].nunique():,}",
        f"- Emails with Jeffrey Epstein as sender: {int(df['epstein_is_sender_bool'].sum()):,}",
        f"- Promotional share: {promo_share:.1%}",
        f"- Date range: {start:%Y-%m-%d} to {end:%Y-%m-%d}",
        f"- Busiest month: {monthly_counts.idxmax():%Y-%m} ({int(monthly_counts.max()):,} emails)",
        "",
        "## Top Senders",
        "",
    ]
    lines.extend(
        f"- {sender}: {count:,}" for sender, count in top_senders.items()
    )
    lines.extend(
        [
            "",
            "## Top Recipients",
            "",
        ]
    )
    lines.extend(
        f"- {recipient}: {count:,}" for recipient, count in top_recipients.items()
    )
    summary_path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def save_plots(
    monthly_counts: pd.Series,
    monthly_split: pd.DataFrame,
    top_senders: pd.Series,
    top_recipients: pd.Series,
    account_counts: pd.Series,
) -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    plt.style.use("seaborn-v0_8-whitegrid")

    fig, ax = plt.subplots(figsize=(13, 5))
    ax.plot(monthly_counts.index, monthly_counts.values, color="#1f4e79", linewidth=2)
    ax.set_title("Monthly Email Volume")
    ax.set_xlabel("Month")
    ax.set_ylabel("Emails")
    fig.autofmt_xdate()
    fig.tight_layout()
    fig.savefig(OUTPUT_DIR / "monthly_volume.png", dpi=180)
    plt.close(fig)

    fig, ax = plt.subplots(figsize=(10, 6))
    ax.barh(top_senders.index[::-1], top_senders.values[::-1], color="#2a9d8f")
    ax.set_title("Top 15 Senders")
    ax.set_xlabel("Email Count")
    fig.tight_layout()
    fig.savefig(OUTPUT_DIR / "top_senders.png", dpi=180)
    plt.close(fig)

    fig, ax = plt.subplots(figsize=(10, 6))
    ax.barh(top_recipients.index[::-1], top_recipients.values[::-1], color="#e76f51")
    ax.set_title("Top 15 Recipients")
    ax.set_xlabel("Email Count")
    fig.tight_layout()
    fig.savefig(OUTPUT_DIR / "top_recipients.png", dpi=180)
    plt.close(fig)

    fig, ax = plt.subplots(figsize=(10, 6))
    ax.bar(account_counts.index, account_counts.values, color="#7b2cbf")
    ax.set_title("Emails by Source Account")
    ax.set_ylabel("Email Count")
    ax.tick_params(axis="x", rotation=20)
    fig.tight_layout()
    fig.savefig(OUTPUT_DIR / "account_breakdown.png", dpi=180)
    plt.close(fig)

    fig, axes = plt.subplots(2, 2, figsize=(16, 11))
    axes[0, 0].plot(monthly_counts.index, monthly_counts.values, color="#1f4e79", linewidth=2)
    axes[0, 0].set_title("Monthly Email Volume")
    axes[0, 0].set_ylabel("Emails")

    monthly_split.plot.area(ax=axes[0, 1], color=["#b8c0ff", "#ff6b6b"], alpha=0.9)
    axes[0, 1].set_title("Monthly Volume by Promotional Flag")
    axes[0, 1].set_xlabel("Month")
    axes[0, 1].set_ylabel("Emails")

    axes[1, 0].barh(top_senders.index[::-1], top_senders.values[::-1], color="#2a9d8f")
    axes[1, 0].set_title("Top 15 Senders")
    axes[1, 0].set_xlabel("Email Count")

    axes[1, 1].barh(top_recipients.index[::-1], top_recipients.values[::-1], color="#e76f51")
    axes[1, 1].set_title("Top 15 Recipients")
    axes[1, 1].set_xlabel("Email Count")

    fig.tight_layout()
    fig.savefig(OUTPUT_DIR / "jmail_dashboard.png", dpi=180)
    plt.close(fig)


def main() -> None:
    dataset_path = ensure_dataset()
    df = pd.read_parquet(dataset_path)

    df["sent_at_ts"] = pd.to_datetime(df["sent_at"], errors="coerce", utc=True)
    df = df.dropna(subset=["sent_at_ts"]).copy()
    df = df[df["sent_at_ts"].dt.year.between(1990, 2030)].copy()
    df["sender_normalized"] = df["sender"].fillna("unknown").map(normalize_contact)
    df["account_email"] = df["account_email"].fillna("unknown")
    df["subject"] = df["subject"].fillna("")
    df["is_promotional_bool"] = df["is_promotional"].fillna(False).astype(str).str.lower().eq("true")
    df["epstein_is_sender_bool"] = (
        df["epstein_is_sender"].fillna(False).astype(str).str.lower().eq("true")
    )
    df["month"] = df["sent_at_ts"].dt.tz_convert(None).dt.to_period("M").dt.to_timestamp()

    top_senders = df["sender_normalized"].value_counts().head(15)
    recipient_counts = build_recipient_series(df).value_counts()
    top_recipients = recipient_counts.head(15)
    monthly_counts = df.groupby("month").size()
    monthly_split = (
        df.groupby(["month", "is_promotional_bool"])
        .size()
        .unstack(fill_value=0)
        .rename(columns={False: "non_promotional", True: "promotional"})
    )
    account_counts = df["account_email"].value_counts().head(10)

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    df.loc[:, ["id", "doc_id", "sender", "subject", "sent_at", "account_email"]].head(5).to_csv(
        OUTPUT_DIR / "first_5_emails.csv",
        index=False,
    )
    write_summary(
        df=df,
        top_senders=top_senders,
        top_recipients=top_recipients,
        monthly_counts=monthly_counts,
        promo_share=float(df["is_promotional_bool"].mean()),
    )
    save_plots(
        monthly_counts=monthly_counts,
        monthly_split=monthly_split,
        top_senders=top_senders,
        top_recipients=top_recipients,
        account_counts=account_counts,
    )

    print(f"Saved analysis outputs to: {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
