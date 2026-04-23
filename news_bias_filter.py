import os
import requests
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
from nltk.stem import WordNetLemmatizer
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch
import warnings

warnings.filterwarnings("ignore")

# Ensure NLTK data is downloaded without printing spam
nltk.download('punkt', quiet=True)
nltk.download('punkt_tab', quiet=True)
nltk.download('stopwords', quiet=True)
nltk.download('wordnet', quiet=True)
nltk.download('vader_lexicon', quiet=True)

from nltk.sentiment import SentimentIntensityAnalyzer

# Load a generic sentiment/classification model to extract attention weights
MODEL_NAME = "distilbert-base-uncased-finetuned-sst-2-english"
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
model = AutoModelForSequenceClassification.from_pretrained(MODEL_NAME, output_attentions=True)

sia = SentimentIntensityAnalyzer()
lemmatizer = WordNetLemmatizer()
stop_words = set(stopwords.words('english'))

def fetch_news(api_key: str):
    """
    Fetch latest news from NewsData.io API.
    """
    url = f"https://newsdata.io/api/1/latest?apikey={api_key}&language=en"
    try:
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            articles = response.json().get('results', [])
            return [
                {
                    "title": a.get("title"),
                    "description": a.get("description"),
                    "content": a.get("content") or a.get("description"),
                    "source": a.get("source_id"),
                    "url": a.get("link")
                }
                for a in articles if a.get("title")
            ]
    except Exception as e:
        print(f"Error fetching news: {e}")
    return []

def preprocess_text(text: str) -> str:
    """
    Clean text (tokenization, stopwords, lemmatization).
    """
    tokens = word_tokenize(text.lower())
    cleaned_tokens = [
        lemmatizer.lemmatize(word) 
        for word in tokens 
        if word.isalnum() and word not in stop_words
    ]
    return " ".join(cleaned_tokens)

def predict_bias(text: str):
    """
    Detect bias types using simpler logic combining polarity metrics.
    high subjectivity -> spin_bias
    strong polarity -> ideology_bias
    """
    scores = sia.polarity_scores(text)
    compound = scores['compound']
    
    bias_types = []
    
    # Strong polarity -> ideology_bias
    if compound > 0.5 or compound < -0.5:
        bias_types.append("ideology_bias")
    
    # High subjectivity / emotional charge -> spin_bias 
    if scores['pos'] > 0.2 or scores['neg'] > 0.2:
        bias_types.append("spin_bias")
        
    # Statement bias when context lacks neutrality
    if "statement_bias" not in bias_types and scores['neu'] < 0.6:
        bias_types.append("statement_bias")
        
    if not bias_types:
        # Default fallback
        bias_types.append("coverage_bias")
        
    confidence = min(0.95, abs(compound) + 0.3) if compound != 0 else 0.65
    
    return list(set(bias_types)), round(confidence, 2)

def explain_bias(text: str):
    """
    Generate word importance using attention weights.
    Extract token-level importance, normalize, and return top subset.
    """
    inputs = tokenizer(text, return_tensors="pt", truncation=True, max_length=512)
    with torch.no_grad():
        outputs = model(**inputs)
    
    # Get attentions from the last layer
    # Shape: (batch_size, num_heads, sequence_length, sequence_length)
    attentions = outputs.attentions[-1] 
    
    # Average across heads for the first sequence in batch, 
    # get attention values from the [CLS] token to all other tokens.
    cls_attention = attentions[0].mean(dim=0)[0].tolist()
    tokens = tokenizer.convert_ids_to_tokens(inputs["input_ids"][0])
    
    word_scores = {}
    
    for token, score in zip(tokens, cls_attention):
        if token in ['[CLS]', '[SEP]', '[PAD]']:
            continue
            
        clean_token = token.replace("##", "")
        if len(clean_token) < 2: 
            continue
        
        # Subword chunks are consolidated by taking maximum attention sum
        if clean_token in word_scores:
            word_scores[clean_token] = max(word_scores[clean_token], score)
        else:
            word_scores[clean_token] = score
            
    # Normalize scores (0.0 to 1.0)
    if word_scores:
        max_score = max(word_scores.values())
        min_score = min(word_scores.values())
        
        sorted_keys = sorted(word_scores.keys())
        for word in sorted_keys:
            if max_score > min_score:
                word_scores[word] = (word_scores[word] - min_score) / (max_score - min_score)
            else:
                word_scores[word] = 1.0
                
    # Select top 15 words
    sorted_words = sorted(word_scores.items(), key=lambda x: x[1], reverse=True)[:15]
    
    highlighted_text = [{"word": word, "score": round(score, 2)} for word, score in sorted_words]
    return highlighted_text