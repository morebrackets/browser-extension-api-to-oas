Browser extention that will capture all JavaScript API requests, to the current base domain as you browse, and turn them into an OpenAPI Specification (OAS)

**Loading the Extension:**

Open your Chrome browser and navigate to chrome://extensions.
Enable "Developer mode" using the toggle switch in the top-right corner.
Click on the "Load unpacked" button. In the file selection dialog, choose the extension directory from this project.
The "API to OAS" extension should now appear in your list of extensions.

**Testing the Functionality:**

Navigate to a website that makes API calls.
A good example would be a single-page application like Twitter, GitHub, or any modern web app.
Browse the site and perform some actions to trigger API requests (e.g., loading new content, submitting a form).
Click on the "API to OAS" extension icon in your browser's toolbar to open the popup.
Click the Generate OAS button.
You should see a generated OpenAPI Specification in the text area based on the captured requests.
Test the Copy OAS button to ensure the content is copied to your clipboard.
Test the Clear Captured Requests button.
After clicking it, generating the OAS again should result in an empty specification.
