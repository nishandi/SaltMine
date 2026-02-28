# All constants — keywords, subreddit targets, thresholds

SUBREDDIT_TARGETS = [
    {"subreddit": "MicrosoftTeams", "platform": "teams", "filter_keywords": None},
    {"subreddit": "microsoft",      "platform": "teams", "filter_keywords": ["teams", "microsoft teams"]},
    {"subreddit": "Windows11",      "platform": "teams", "filter_keywords": ["teams", "microsoft teams"]},
    {"subreddit": "techsupport",    "platform": "teams", "filter_keywords": ["teams", "microsoft teams"]},
    {"subreddit": "mspowerusers",   "platform": "teams", "filter_keywords": ["teams"]},
    {"subreddit": "Slack",          "platform": "slack", "filter_keywords": None},
    {"subreddit": "productivity",   "platform": "slack", "filter_keywords": ["slack"]},
    {"subreddit": "techsupport",    "platform": "slack", "filter_keywords": ["slack"]},
]

# Consumer/enterprise classifier
CONSUMER_KEYWORDS = [
    "personal account", "personal use", "free version", "teams for life",
    "teams personal", "family", "friends", "home", "not work", "consumer",
    "personal teams", "free teams", "my friends", "my family", "personal chat",
]

ENTERPRISE_KEYWORDS = [
    "tenant", "admin", "it department", "our organization", "o365",
    "office 365", "sharepoint", "azure ad", "aad", "compliance",
    "teams rooms", "deployment", "mdm", "license", "enterprise",
    "our company", "company policy", "it admin", "helpdesk",
    "conditional access", "intune",
]

CONSUMER_BOOST_SUBREDDITS = ["techsupport"]
CONSUMER_BOOST_PHRASES = ["personal account", "free version"]
CONSUMER_THRESHOLD = 0.4

# Slack enterprise signal — posts matching these are discarded
SLACK_ENTERPRISE_KEYWORDS = [
    "enterprise grid", "enterprise plan", "business+ plan",
    "workspace admin", "org admin", "sales team", "slack connect enterprise",
]

# Feature buckets
FEATURE_TAGS = {
    "calling_video":     ["call", "calling", "video call", "dropped call", "call quality", "video quality", "join call", "meet"],
    "notifications":     ["notification", "notify", "alert", "badge", "ping", "dnd", "do not disturb", "notification sound"],
    "mobile_app":        ["ios", "iphone", "android", "mobile app", "phone app", "app crash", "mobile version"],
    "presence_status":   ["status", "presence", "available", "busy", "away", "appear offline", "green dot"],
    "file_sharing":      ["file", "attachment", "upload", "download", "share file", "onedrive", "document"],
    "chat_messaging":    ["message", "chat", "dm", "direct message", "reply", "thread", "read receipt"],
    "performance_speed": ["slow", "lag", "loading", "performance", "hang", "freeze", "memory", "cpu", "heavy"],
    "login_account":     ["login", "sign in", "sign out", "account", "password", "two-factor", "2fa", "authentication"],
    "ui_design":         ["ui", "interface", "design", "layout", "dark mode", "theme", "button", "ugly", "redesign"],
    "reliability_bugs":  ["crash", "bug", "broken", "not working", "error", "issue", "glitch", "stopped working"],
}

# Pipeline settings
ROLLING_WINDOW_DAYS = 90
LOOKBACK_HOURS = 24
SPIKE_THRESHOLD = 1.5       # 50% higher than 4-week avg
SPIKE_WINDOW_DAYS = 7       # "current week"
SPIKE_BASELINE_START = 8    # days 8–35 = the 4-week baseline
SPIKE_BASELINE_END = 35
DB_BATCH_SIZE = 100
