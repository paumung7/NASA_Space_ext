# NASA Space Explorer

Explore NASA's [Astronomy Picture of the Day (APOD)](https://apod.nasa.gov/apod/) archive by date. Search and sort results, save favorites in your browser, discover a random day, and view image details or videos. This independent project is not affiliated with or endorsed by NASA.

## Run locally

1. Install Node.js 20.19+ or 22.12+ and npm.
2. Install dependencies: `npm install`.
3. Copy `.env.example` to `.env`. For initial testing, `DEMO_KEY` works without configuration, but has low shared limits. Get your own key at [api.nasa.gov](https://api.nasa.gov/) and set `VITE_NASA_API_KEY` in `.env`.
4. Start the app: `npm run dev`. Open the URL printed by Vite.
5. Run checks with `npm test` and `npm run build`.

Select a preset or enter a custom date range, then select **Explore**. The archive begins June 16, 1995. Ranges are limited by this app to 90 days and requested in chunks of up to 30 days to keep responses manageable. NASA may omit unavailable dates. Favorites are stored locally in the current browser and are not synced across devices.

If APOD is unavailable or returns placeholder logos, the gallery displays clearly labeled NASA Image Library highlights instead. These highlights are not filtered by the selected dates. Gallery results are shown nine per page.

## API keys and optional proxy

The app uses the [official APOD API](https://api.nasa.gov/) with `start_date`, `end_date`, and `thumbs=true` for video thumbnails. NASA's `DEMO_KEY` is for development and initial testing, with shared rate limits (currently 30 requests per hour and 50 per day). Your own key has its own NASA quota. API availability and quotas are controlled by NASA.

**Vite environment variables are embedded in the frontend and visible to every visitor. A `VITE_NASA_API_KEY` is not a secret.** Never commit real keys or `.env` files; the supplied `.gitignore` excludes them.

To keep a key off the client, run the included optional Node proxy on a trusted server:

1. Set the server-only environment variables `NASA_API_KEY` to your key and `ALLOWED_ORIGIN` to your frontend's exact origin (for local Vite, `http://localhost:5173`). Optionally set `PORT` (default `3001`).
2. Run `node server/proxy.js` in that environment.
3. Set `VITE_APOD_PROXY_URL` in the frontend's `.env` to the proxy endpoint, for example `http://localhost:3001/api/apod`, and restart Vite. Remove `VITE_NASA_API_KEY` from the frontend configuration.

The proxy forwards only APOD date and thumbnail parameters and keeps the key server-side. CORS is not authentication: for a public deployment, add suitable authentication, rate limiting, monitoring, and HTTPS at your hosting layer to prevent abuse of your quota. The proxy must be hosted separately when using static GitHub Pages or a static Vercel deployment.

## Deploy to GitHub Pages

1. Push the project to a GitHub repository. Do not push your `.env` file.
2. In **Settings > Pages**, choose **GitHub Actions** as the source.
3. Create a repository Actions variable named `VITE_NASA_API_KEY` for a public browser key, or `VITE_APOD_PROXY_URL` for your separately hosted proxy. These values are public in the built site. With neither set, the app uses `DEMO_KEY`.
4. Push to the `main` branch or run the included workflow manually. Find the URL under **Settings > Pages**.

## Deploy to Vercel

1. Import the GitHub repository into Vercel and select the Vite framework preset.
2. Set `VITE_NASA_API_KEY` or `VITE_APOD_PROXY_URL` in the project environment variables, understanding that both are public in the browser bundle.
3. Deploy. Vercel runs `npm run build` and serves the `dist` directory. Redeploy after changing frontend environment variables.

The hero photograph is provided by [Unsplash](https://unsplash.com/); APOD media and descriptions are provided by NASA and their credited contributors. Check each entry's copyright before reuse.