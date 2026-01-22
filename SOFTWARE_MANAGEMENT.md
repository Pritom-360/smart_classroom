# Student Software JSON Management Guide

This guide explains how to manage the student software section using the JSON file.

## 📁 File Location
The software data is stored in: `data/software.json`

## 📝 JSON Structure

Each software item has the following properties:

```json
{
  "id": 1,
  "name": "Software Name",
  "description": "Brief description of the software",
  "category": "Category Name",
  "icon": "FontAwesome icon class",
  "keywords": "space separated search keywords",
  "downloadLink": "#",
  "featured": true
}
```

### Property Descriptions:

- **id**: Unique identifier for the software (number)
- **name**: Display name of the software (string)
- **description**: Brief description shown on the card (string)
- **category**: Category tag (e.g., "Design", "Programming", "Utility")
- **icon**: FontAwesome icon class (e.g., "fas fa-code", "fab fa-java")
- **keywords**: Space-separated keywords for search functionality
- **downloadLink**: URL for download (use "#" if not available yet)
- **featured**: Boolean to mark featured software (currently not used in UI, but reserved for future features)

## ✏️ How to Add New Software

1. Open `data/software.json`
2. Add a new object to the "software" array
3. Follow this template:

```json
{
  "id": 16,
  "name": "Your Software Name",
  "description": "Your software description here",
  "category": "Category Name",
  "icon": "fas fa-icon-name",
  "keywords": "keyword1 keyword2 keyword3",
  "downloadLink": "#",
  "featured": false
}
```

4. Make sure to add a comma after the previous item
5. Save the file
6. Refresh the products page

## 🔄 How to Update Existing Software

1. Open `data/software.json`
2. Find the software item by its ID or name
3. Edit the desired properties
4. Save the file
5. Refresh the products page

## ❌ How to Remove Software

1. Open `data/software.json`
2. Find and delete the entire object for that software
3. Make sure to remove any trailing commas
4. Save the file
5. Refresh the products page

## 🎨 Available Categories

Current categories in use:
- Productivity
- Design
- Video Editing
- Engineering
- Mathematics
- Programming
- Statistics
- Utility

You can create new categories by simply using a new name in the "category" field.

## 🔍 Search Keywords Tips

- Include the software name in lowercase
- Add common abbreviations (e.g., "idm" for Internet Download Manager)
- Include related terms and features
- Separate keywords with spaces

## 🖼️ FontAwesome Icons

Common icon classes you can use:
- `fas fa-code` - Code/Programming
- `fas fa-image` - Images/Photos
- `fas fa-video` - Video
- `fas fa-file-word` - Documents/Office
- `fas fa-calculator` - Math/Calculator
- `fas fa-cube` - 3D/CAD
- `fab fa-java` - Java
- `fab fa-python` - Python

Find more icons at: https://fontawesome.com/icons

## ⚠️ Important Notes

### Running Locally

The JSON file is loaded via JavaScript's `fetch()` API. Due to browser security (CORS policy), this won't work when opening HTML files directly (`file://` protocol).

**To test locally, you need to run a local web server:**

### Option 1: VS Code Live Server (Recommended)
1. Install "Live Server" extension in VS Code
2. Right-click on `products.html`
3. Select "Open with Live Server"

### Option 2: Python HTTP Server
```bash
# Python 3
python -m http.server 8000

# Then open: http://localhost:8000/products.html
```

### Option 3: Node.js HTTP Server
```bash
npx http-server

# Then open the URL shown in terminal
```

## 🐛 Troubleshooting

### Software not showing up?
- Check if the JSON file has valid syntax (no trailing commas, proper quotes)
- Use a JSON validator: https://jsonlint.com/
- Check browser console for errors (F12)

### Search not working?
- Ensure JavaScript is enabled in your browser
- Check browser console for errors
- Make sure `products.js` is properly loaded

### Icons not showing?
- Check FontAwesome CDN is loaded in HTML
- Verify icon class name is correct
- Check if internet connection is available (FontAwesome loads from CDN)

## 📊 Current Software Count

The file currently contains **15 software items** across 8 categories.

## 🔒 JSON Validation

Before saving changes, validate your JSON:
1. Copy the entire JSON content
2. Go to https://jsonlint.com/
3. Paste and click "Validate JSON"
4. Fix any errors shown

## Example: Adding a New Software

```json
{
  "id": 16,
  "name": "PyCharm Professional",
  "description": "Python IDE for professional developers with advanced code analysis and debugging.",
  "category": "Programming",
  "icon": "fab fa-python",
  "keywords": "python ide development pycharm jetbrains",
  "downloadLink": "#",
  "featured": false
}
```

## 🎯 Best Practices

1. **Always validate JSON** before committing changes
2. **Use sequential IDs** - The next ID should be + 1 from the last
3. **Keep descriptions concise** - Aim for 1-2 sentences
4. **Include relevant keywords** - Think about what students might search for
5. **Test after adding** - Always refresh and test the page
6. **Backup the file** - Keep a backup before major changes

## 📞 Need Help?

If you encounter issues or need help:
1. Check browser console (F12) for error messages
2. Validate JSON syntax at jsonlint.com
3. Ensure you're running a local web server (not using file://)
4. Check that all files are in correct locations

---

**Last Updated**: January 22, 2026
**Maintained by**: Smart Classroom Team
