import joblib

model = joblib.load("models/logistic_model.pkl")

print("Number of features:", len(model.feature_names_in_))
print("Feature names:")
print(model.feature_names_in_)
