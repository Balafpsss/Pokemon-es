// Scraper de Nuvio: Pokémon en castellano desde YouTube (canal oficial Pokémon TV).
// Edita EPISODIOS para añadir más vídeos: "temporada-episodio": "ID_DE_YOUTUBE"

// ID de TMDB de la serie Pokémon (1997): themoviedb.org/tv/60572
const TMDB_ID_POKEMON = "60572";

const EPISODIOS = {
  "1-1": "uPX8cBfNzvc"
  // "1-2": "xxxxxxxxxxx",
  // "1-3": "xxxxxxxxxxx",
};

// Varios "clientes" de YouTube: si uno falla, se prueba el siguiente.
const CLIENTES = [
  {
    ua: "com.google.ios.youtube/19.09.3 (iPhone14,3; U; CPU iOS 15_6 like Mac OS X)",
    ctx: { clientName: "IOS", clientVersion: "19.09.3", deviceModel: "iPhone14,3", hl: "es", gl: "ES" }
  },
  {
    ua: "com.google.android.youtube/19.09.37 (Linux; U; Android 11) gzip",
    ctx: { clientName: "ANDROID", clientVersion: "19.09.37", androidSdkVersion: 30, hl: "es", gl: "ES" }
  },
  {
    ua: "Mozilla/5.0 (SMART-TV; Linux; Tizen 6.5) AppleWebKit/537.36 (KHTML, like Gecko) 85.0.4183.93/6.5 TV Safari/537.36",
    ctx: { clientName: "TVHTML5_SIMPLY_EMBEDDED_PLAYER", clientVersion: "2.0", hl: "es", gl: "ES" },
    embed: true
  }
];

async function pedirPlayer(videoId, cliente) {
  const context = { client: cliente.ctx };
  if (cliente.embed) context.thirdParty = { embedUrl: "https://www.youtube.com/watch?v=" + videoId };

  const res = await fetch("https://www.youtube.com/youtubei/v1/player?prettyPrint=false", {
    method: "POST",
    headers: { "Content-Type": "application/json", "User-Agent": cliente.ua },
    body: JSON.stringify({ videoId: videoId, context: context })
  });
  const data = await res.json();
  const estado = data && data.playabilityStatus && data.playabilityStatus.status;
  if (estado !== "OK" || !data.streamingData) return null;

  const sd = data.streamingData;
  if (sd.hlsManifestUrl) {
    return { url: sd.hlsManifestUrl, quality: "Auto", ua: cliente.ua };
  }
  const combinados = (sd.formats || []).filter(function (f) { return f.url; });
  if (!combinados.length) return null;
  combinados.sort(function (a, b) { return (b.height || 0) - (a.height || 0); });
  return { url: combinados[0].url, quality: (combinados[0].height || 360) + "p", ua: cliente.ua };
}

async function resolverYoutube(videoId) {
  for (let i = 0; i < CLIENTES.length; i++) {
    try {
      const r = await pedirPlayer(videoId, CLIENTES[i]);
      if (r) return r;
    } catch (e) {
      // probamos el siguiente cliente
    }
  }
  return null;
}

async function getStreams(tmdbId, mediaType, season, episode) {
  if (mediaType !== "tv") return [];
  if (String(tmdbId) !== TMDB_ID_POKEMON) return [];

  const id = EPISODIOS[season + "-" + episode];
  if (!id) return [];

  const r = await resolverYoutube(id);
  if (!r) return [];

  return [
    {
      name: "Pokémon ES",
      title: "T" + season + "E" + episode + " · Castellano",
      url: r.url,
      quality: r.quality,
      headers: { "User-Agent": r.ua }
    }
  ];
}

module.exports = { getStreams };
