import pandas as pd
from sklearn.tree import DecisionTreeClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
import joblib

# Load data
data = pd.read_csv("data.csv")

X = data.drop("risk", axis=1)
y = data["risk"]

# Train models
dt = DecisionTreeClassifier(max_depth=4)
dt.fit(X, y)

lr = LogisticRegression(max_iter=1000)
lr.fit(X, y)

# Save models
joblib.dump(dt, "decision_tree.pkl")
joblib.dump(lr, "logistic_regression.pkl")

print("✅ Models trained and saved")
