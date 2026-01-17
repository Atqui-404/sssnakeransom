from flask import Flask, render_template, request, jsonify
import datetime


app = Flask(
    __name__,
    template_folder="templates"
)

@app.route("/")
def home():
    return render_template('index.html')

@app.route('/claim-certificate', methods=['POST'])
def claim_certificate():
    """
    Called when the user survives 32 days and passes the last captcha
    Calculates the exact time wasted.
    """
    data = request.json
    start_time = data.get('startTime')  # sent from JS
    end_time = datetime.datetime.now().timestamp() * 1000
    
    # Calculate duration 
    duration_seconds = (end_time - start_time) / 1000
    
    return jsonify({
        "status": "success", 
        "message": f"You wasted {duration_seconds} seconds of your life.",
        "certificate_url": "/static/certificates/placeholder.png"
    })

# Prevent non-Chrome browsers from accessing the site
@app.before_request
def limit_browser():
    user_agent = request.headers.get('User-Agent', '').lower()
    if 'chrome' not in user_agent and request.path != '/favicon.ico':
        return '''
        <html>
        <head><title>Access Denied</title></head>
        <body style="display:flex;height:100vh;justify-content:center;align-items:center;
                     background:black;color:red;font-family:monospace;font-size:24px;text-align:center;">
            <div>
                <h1>⛔ CHROME ONLY ⛔</h1>
                <p>Access restricted to Google Chrome browser only.</p>
            </div>
        </body>
        </html>
        ''', 403
    
@app.after_request
def add_header(response):
    # Prevents embedding on other sites
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-Content-Type-Options'] = 'nosniff'
    return response

# Run the app
if __name__ == "__main__":
    app.run()