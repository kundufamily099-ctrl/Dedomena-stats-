const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.YOUTUBE_API_KEY;

// Website ki files serve karega
app.use(express.static(__dirname));

// YouTube channel search API
app.get("/api/channel", async (req, res) => {
  try {
    const query = String(req.query.q || "").trim();

    if (!query) {
      return res.status(400).json({
        error: "Channel name enter karo."
      });
    }

    if (!API_KEY) {
      return res.status(500).json({
        error: "Server API key configure nahi hai."
      });
    }

    const searchUrl = new URL(
      "https://www.googleapis.com/youtube/v3/search"
    );

    searchUrl.searchParams.set("part", "snippet");
    searchUrl.searchParams.set("type", "channel");
    searchUrl.searchParams.set("maxResults", "1");
    searchUrl.searchParams.set("q", query);
    searchUrl.searchParams.set("key", API_KEY);

    const searchResponse = await fetch(searchUrl);
    const searchData = await searchResponse.json();

    if (!searchResponse.ok) {
      return res.status(502).json({
        error: "YouTube search failed."
      });
    }

    const channelId =
      searchData.items?.[0]?.id?.channelId;

    if (!channelId) {
      return res.status(404).json({
        error: "Channel nahi mila."
      });
    }

    const channelUrl = new URL(
      "https://www.googleapis.com/youtube/v3/channels"
    );

    channelUrl.searchParams.set(
      "part",
      "snippet,statistics"
    );
    channelUrl.searchParams.set("id", channelId);
    channelUrl.searchParams.set("key", API_KEY);

    const response = await fetch(channelUrl);
    const data = await response.json();

    if (!response.ok) {
      return res.status(502).json({
        error: "Channel data nahi mila."
      });
    }

    const channel = data.items?.[0];

    if (!channel) {
      return res.status(404).json({
        error: "Channel nahi mila."
      });
    }

    res.json({
      id: channel.id,
      title: channel.snippet.title,
      thumbnail: channel.snippet.thumbnails?.high?.url,
      subscribers:
        channel.statistics.subscriberCount || "Hidden",
      views: channel.statistics.viewCount || "0",
      videos: channel.statistics.videoCount || "0",
      url:
        "https://www.youtube.com/channel/" +
        channel.id
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Server mein problem hui."
    });
  }
});

app.listen(PORT, () => {
  console.log("Dedomena Stats is running!");
});
