"""One-off helper: pull the story content out of the old index.html into stories.json."""
import json
import re
from pathlib import Path

from bs4 import BeautifulSoup, NavigableString, Tag

ROOT = Path(__file__).resolve().parent.parent
soup = BeautifulSoup((ROOT / "index.html").read_text(encoding="utf-8"), "html.parser")

stories = []
for reader in soup.select("div.reader"):
    sid = reader["id"]
    number = int(re.sub(r"\D", "", sid))
    title = reader.find("h2").get_text(" ", strip=True)
    audio = reader.find("audio").find("source")["src"]

    body = reader.find("p")
    lines = [line.strip() for line in body.get_text("\n").split("\n") if line.strip()]
    marker = next(i for i, line in enumerate(lines) if "ENGLISH TRANSLATION" in line.upper())
    tamil = lines[:marker]
    english = [line for line in lines[marker + 1 :] if line]

    quiz = reader.select_one("div.quiz")
    questions = []
    current = None
    for node in quiz.children:
        if not isinstance(node, Tag):
            continue
        if node.name == "p" and "result" not in (node.get("class") or []):
            prompt = re.sub(r"^\d+\.\s*", "", node.get_text(" ", strip=True))
            current = {"prompt": prompt, "options": []}
            questions.append(current)
        elif node.name == "label" and current is not None:
            inp = node.find("input")
            current["options"].append(
                {
                    "text": node.get_text(" ", strip=True),
                    "correct": inp is not None and inp.has_attr("data-correct"),
                }
            )

    stories.append(
        {
            "id": number,
            "title": re.sub(r"^\d+\.\s*", "", title),
            "audio": audio,
            "tamil": tamil,
            "english": english,
            "quiz": questions,
        }
    )

stories.sort(key=lambda s: s["id"])
out = ROOT / "scripts" / "stories.json"
out.write_text(json.dumps(stories, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"Wrote {len(stories)} stories to {out}")
for story in stories:
    print(
        story["id"],
        story["title"].encode("ascii", "backslashreplace").decode(),
        f"({len(story['tamil'])} ta / {len(story['english'])} en / {len(story['quiz'])} quiz)",
    )
