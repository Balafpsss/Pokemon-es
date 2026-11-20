// Scraper de Nuvio: Pokémon en castellano desde YouTube.
// Edita EPISODIOS para añadir más vídeos: "temporada-episodio": "ID_DE_YOUTUBE"

// ID de TMDB de la serie Pokémon (comprueba el tuyo en themoviedb.org).
const TMDB_ID_POKEMON = "60572";

const EPISODIOS = {
  "1-1": "uPX8cBfNzvc"
  // "1-2": "xxxxxxxxxxx",
  // "1-3": "xxxxxxxxxxx",
};

// Resuelve un enlace reproducible a partir del ID de YouTube.
// Usa la API interna de YouTube (innertube); puede dejar de funcionar
// cuando YouTube cambie cosas. Si falla, devuelve null.
async function resolverYoutube(videoId) {
  try {
    const res = await fetch("https://www.youtube.com/youtubei/v1/player?prettyPrint=false", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "com.google.android.youtube/19.09.37 (Linux; U; Android 11) gzip"
      },
      body: JSON.stringify({
        videoId: videoId,
        context: {
          client: {
            clientName: "ANDROID",
            clientVersion: "19.09.37",
            androidSdkVersion: 30,
            hl: "es",
            gl: "ES"
          }
        }
      })
    });
    const data = await res.json();
    const sd = data && data.streamingData;
    if (!sd) return null;

    // Preferimos HLS si existe (sirve para directos)
    if (sd.hlsManifestUrl) return { url: sd.hlsManifestUrl, quality: "Auto" };

    // Formato combinado (vídeo+audio), el de mayor altura
    const combinados = (sd.formats || []).filter(f => f.url);
    if (!combinados.length) return null;
    combinados.sort((a, b) => (b.height || 0) - (a.height || 0));
    const mejor = combinados[0];
    return { url: mejor.url, quality: (mejor.height || 360) + "p" };
  } catch (e) {
    return null;
  }
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
      headers: {}
    }
  ];
}

module.exports = { getStreams };
