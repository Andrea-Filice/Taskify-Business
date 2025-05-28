import sys
import json
import re

def parse_input(text):
    multi_match = re.match(
        r"/create\d+\s+([^\s]+(?:\s*,\s*[^\s]+)*)\s+([^\s]+(?:\s*,\s*[^\s]+)*)\s+to\s+newer\s+([^\s]+(?:\s*,\s*[^\s]+)*)(?:\s+!category\s+([^\s]+(?:\s*,\s*[^\s]+)*))?",
        text, re.IGNORECASE
    )

    if multi_match:
        names = [n.strip() for n in multi_match.group(1).split(',')]
        prev_versions = [v.strip() for v in multi_match.group(2).split(',')]
        next_versions = [v.strip() for v in multi_match.group(3).split(',')]
        categories = [c.strip().lower() for c in multi_match.group(4).split(',')] if multi_match.group(4) else []

        tasks = []
        for i in range(len(names)):
            name = names[i] if i < len(names) else ""
            prev_version = prev_versions[i] if i < len(prev_versions) else ""
            next_version = next_versions[i] if i < len(next_versions) else ""
            category_raw = categories[i] if i < len(categories) else ""
            if category_raw == "maintenance":
                category = "softwareComponents"
            else:
                category = "fuoriManutenzione"
            tasks.append({
                "name": name,
                "prev_version": prev_version,
                "next_version": next_version,
                "category": category
            })
        return {"tasks": tasks}
    modify_match = re.match(
        r"/modify\s+([^\s]+)\s+!category\s+([^\s]+)", text, re.IGNORECASE
    )
    if modify_match:
        name = modify_match.group(1)
        category_raw = modify_match.group(2).lower()
        if category_raw == "maintenance":
            category = "softwareComponents"
        else:
            category = "fuoriManutenzione"
        return {
            "name": name,
            "category": category,
            "modify": True
        }

    match = re.match(
        r"/create\s+([^\s]+)\s+\(?([^\s)]+)\)?\s+to\s+newer\s+\(?([^\s)]+)\)?(?:\s+!category\s+([^\s]+))?",
        text, re.IGNORECASE
    )

    if match:
        name = match.group(1)
        prev_version = match.group(2)
        next_version = match.group(3)
        category_raw = (match.group(4) or "").lower()
        if category_raw == "maintenance":
            category = "softwareComponents"
        else:
            category = "fuoriManutenzione"
        return {
            "name": name,
            "prev_version": prev_version,
            "next_version": next_version,
            "category": category
        }
    elif (text == "/help"):
        return 'Commands for AI Assistance: <br><br> /create = Create a Task, the syntax is: <i>/create TaskName previousVersion to newer newerVersion !category maintenace/out</i> <br><br> /modify = Modify a Task, the syntax is: <i>/modify taskName !category maintenance/out '
    elif (text == "hello" or text == "HELLO" or text == "Hello"):
        return 'HI! Welcome to AI Assistance of Taskify! write /help for more commands!'
    else:
        return 'Sorry, I am unable to elaborating your request. if you need help, type /help.'

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No input provided"}))
        return
    input_text = sys.argv[1]
    result = parse_input(input_text)
    if result:
        print(json.dumps(result))
    else:
        print(json.dumps({"Sorry, I am unable to elaborating your request. if you need help, type /help."}))

main()