import json
import os
from collections import defaultdict
from typing import Any
from pydantic import SecretStr

from langchain_core.messages import HumanMessage
from langchain_groq import ChatGroq

api_key = os.getenv("GROQ_API_KEY")
if not api_key:
    raise RuntimeError(
        "GROQ_API_KEY not set in environment"
    )
class LLMService:

    @staticmethod
    def _get_client() -> ChatGroq:

        model = os.getenv(
            "GROQ_MODEL",
            "llama-3.3-70b-versatile",
        )

        temperature = float(
            os.getenv("GROQ_TEMPERATURE", "0")
        )

        api_key_secret = (
            SecretStr(api_key) if api_key is not None else None
        )

        return ChatGroq(
            model=model,
            temperature=temperature,
            api_key=api_key_secret,
        )

    @staticmethod
    def _invoke(
        client: ChatGroq,
        prompt: str,
    ) -> str:

        message = HumanMessage(
            content=prompt
        )

        response = client.invoke([message])

        content = getattr(
            response,
            "content",
            None,
        )

        return (
            content
            if content is not None
            else str(response)
        )

    @staticmethod
    async def extract_comments(
        chunks: list[dict],
    ) -> list[dict]:

        client = LLMService._get_client()

        prompt_template = """
        Extract individual consultation comments from the following text.

        For each comment, return a JSON object with exactly these keys:

        - stakeholder_type
        - content
        - topic
        - raw_issue
        - clause
        - recommendation

        Return ONLY a valid JSON array.
        Do not include markdown.
        Do not include ```json.

        Text:
        {text}
        """

        comments = []

        for chunk in chunks:

            text = chunk.get(
                "content",
                "",
            )

            if not text.strip():
                continue

            prompt = prompt_template.format(
                text=text
            )

            try:
                output = LLMService._invoke(
                    client,
                    prompt,
                )

                parsed = json.loads(output)

                if isinstance(parsed, list):
                    comments.extend(parsed)

            except (json.JSONDecodeError, Exception):
                # Best-effort fallback.
                comments.append(
                    {
                        "stakeholder_type": "Unknown",
                        "content": text,
                        "topic": None,
                        "raw_issue": None,
                        "clause": None,
                        "recommendation": None,
                    }
                )

        return comments

    @staticmethod
    async def generate_summary(
        comments: list[dict],
    ) -> str:

        if not comments:
            return ""

        client = LLMService._get_client()

        joined_comments = "\n\n".join(
            comment.get("content", "")
            for comment in comments
        )

        prompt = f"""
            Create a concise overall summary of the following
            consultation comments.

            Summarize the major concerns, recurring themes,
            and important recommendations.

            Keep the summary to 2-4 sentences.

            Comments:
            {joined_comments}
        """

        output = LLMService._invoke(
            client,
            prompt,
        )

        return output.strip()

    @staticmethod
    async def generate_stakeholder_summary(
        comments: list[dict],
    ) -> dict:

        if not comments:
            return {}

        client = LLMService._get_client()

        groups = defaultdict(list)

        for comment in comments:

            stakeholder = comment.get(
                "stakeholder_type",
                "Unknown",
            )

            content = comment.get(
                "content",
                "",
            )

            groups[stakeholder].append(
                content
            )

        prompt_parts = []

        for stakeholder, items in groups.items():

            prompt_parts.append(
                f"[{stakeholder}]\n"
                + "\n".join(items)
            )

        prompt = f"""
        For each stakeholder section below, generate a
        short summary of their major concerns.

        Return ONLY a valid JSON object where:

        - each key is a stakeholder type
        - each value is a 1-2 sentence summary

        Do not include markdown.
        Do not include ```json.

        Stakeholder comments:

        {"\n\n".join(prompt_parts)}
        """

        output = LLMService._invoke(
            client,
            prompt,
        )

        try:

            parsed = json.loads(output)

            if isinstance(parsed, dict):
                return parsed

        except json.JSONDecodeError:
            pass

        # Fallback if the LLM doesn't return valid JSON.
        summaries = {}

        for stakeholder, items in groups.items():

            combined = " ".join(items)

            if len(combined) > 400:
                combined = combined[:400] + "..."

            summaries[stakeholder] = combined

        return summaries

    @staticmethod
    async def generate_consensus(
        comments: list[dict],
    ) -> dict:

        if not comments:
            return {
                "agreements": [],
                "disagreements": [],
                "recommendations": [],
            }

        client = LLMService._get_client()

        joined_comments = "\n\n".join(
            comment.get("content", "")
            for comment in comments
        )

        prompt = f"""
        Analyze the following consultation comments.

        Identify:

        1. Common areas of agreement
        2. Major areas of disagreement
        3. Common recommendations

        Return ONLY a valid JSON object with exactly these keys:

        {{
            "agreements": [],
            "disagreements": [],
            "recommendations": []
        }}

        Each value must be an array of short strings.

        Do not include markdown.
        Do not include ```json.

        Comments:
        {joined_comments}
        """

        output = LLMService._invoke(
            client,
            prompt,
        )

        try:

            parsed = json.loads(output)

            if isinstance(parsed, dict):
                return parsed

        except json.JSONDecodeError:
            pass

        # Fallback using recommendations already
        # extracted from individual comments.
        recommendations = [
            comment.get("recommendation")
            for comment in comments
            if comment.get("recommendation")
        ]

        recommendations = list(
            dict.fromkeys(recommendations)
        )

        return {
            "agreements": [],
            "disagreements": [],
            "recommendations": recommendations,
        }
