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
    # Get category title and clean it up
    if category.find("div", class_="category-title"):
        category_title = category.find("div", class_="category-title").text.strip()
        category_title = category_title.replace("\t", "").replace("\n", " ")
        # Remove the "(more info)" text
        category_title = category_title.replace("(more info)", "").strip()
    else:
        category_title = "Unknown"

    predictions_list = []
    for item in category.find("ul", class_="predictions-list").find_all("li"):
        position = item.find("div", class_="predictions-position-v2").text.strip() if item.find("div", class_="predictions-position-v2") else None
        
        # Get the name and handle actor/movie splitting if needed
        name_element = item.find("div", class_="predictions-name")
        name = name_element.text.strip() if name_element else None
        actor_name = None
        movie_title = None
        
        # If there's a newline in the name, it's likely an actor category
        if name and '\n' in name:
            parts = name.split('\n', 1)  # Split only on first newline
            actor_name = parts[0].strip()
            movie_title = parts[1].strip() if len(parts) > 1 else None
        
        # Extract image source from predictions-photo div
        photo_div = item.find("div", class_="predictions-photo")
        image_url = None
        if photo_div and photo_div.find("img"):
            image_url = photo_div.find("img").get("src")
        
        # Extract only the third odds value (fractional odds)
        odds_elements = item.find_all("div", class_="predictions-odds predictions-experts gray")
        fractional_odds = odds_elements[2].text.strip() if len(odds_elements) > 2 else None

        nominee_data = {
            "position": position,
            "image": image_url,
            "odds": fractional_odds
        }
        
        # Add the appropriate name fields based on whether it's an actor category
        if actor_name:
            nominee_data["actor"] = actor_name
            nominee_data["movie"] = movie_title
        else:
            nominee_data["name"] = name
            
        predictions_list.append(nominee_data)

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