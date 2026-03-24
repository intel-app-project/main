# [CSV Upload to Supabase 'test' Table]

The objective is to allow the user to upload a CSV file from the React Native app and have the FastAPI backend parse it and reflect the data in the Supabase `test` table.

## User Review Required
> [!IMPORTANT]
> The Supabase `test` table must already exist and have columns that match the CSV file headers. If the CSV headers do not match the columns in the `test` table, the Supabase insertion will fail. Please ensure the CSV format and `test` table schema are aligned.
> Also, FastAPI **requires** `python-multipart` to handle file uploads. If it is not installed in your Conda environment, we will need to run `pip install python-multipart`.

## Proposed Changes

### Backend Implementation
#### [MODIFY] [main.py](file:///c:/Users/shmin/Desktop/main/backend/main.py)
- Import `UploadFile`, `File` from `fastapi`.
- Import `pandas` and `io`.
- Add an `@app.post("/upload-csv")` endpoint.
- Read the uploaded file into a Pandas DataFrame.
- Convert the DataFrame to a list of dictionaries.
- Use the Supabase client to insert the data into the `test` table: `supabase.table("test").insert(data).execute()`.

### Mobile App (React Native)
#### [MODIFY] [recorderScreen.js](file:///c:/Users/shmin/Desktop/main/app/screen/recorderScreen.js)
- Ensure the `API_BASE_URL` points to the correctly hosted or local FastAPI server IP (e.g. `http://<your-local-ip>:8000`). No major code changes are strictly required here as `uploadCsvToServer` already posts to `/upload-csv`.

## Verification Plan
1. **Automated/Manual Testing**: Send a test CSV via the app.
2. **Supabase Verification**: Check if the `/api/test` endpoint or Supabase dashboard reflects the newly uploaded data.
