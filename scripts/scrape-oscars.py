from bs4 import BeautifulSoup
import json
import requests

url = "https://www.goldderby.com/odds/combined-odds/oscars-2025-predictions/#odds-page"

# Load the HTML file or string
response = requests.get(url)
soup = BeautifulSoup(response.text, "html.parser")

# Initialize an empty list for storing predictions
predictions = []


# Iterate over each category
for category in soup.find_all("div", class_="predictions-wrapper"):
    category_title = category.find("div", class_="category-title").text.strip().replace("\t", "").replace("\n", " ") if category.find("div", class_="category-title") else "Unknown"

    predictions_list = []
    for item in category.find("ul", class_="predictions-list").find_all("li"):
        position = item.find("div", class_="predictions-position-v2").text.strip() if item.find("div", class_="predictions-position-v2") else None
        name = item.find("div", class_="predictions-name").text.strip() if item.find("div", class_="predictions-name") else None
        
        # Extract only the third odds value (fractional odds)
        odds_elements = item.find_all("div", class_="predictions-odds predictions-experts gray")
        fractional_odds = odds_elements[2].text.strip() if len(odds_elements) > 2 else None

        predictions_list.append({
            "position": position,
            "name": name,
            "odds": fractional_odds  # Keep only the fractional odds
        })

    predictions.append({
        "category": category_title,
        "predictions": predictions_list
    })

# Convert to JSON
json_output = json.dumps(predictions, indent=4, ensure_ascii=False)

# Save JSON to file
with open("oscars_predictions.json", "w", encoding="utf-8") as json_file:
    json_file.write(json_output)

print("JSON file saved successfully.")