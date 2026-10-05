"""Text utilities shared by the AI and search services.

Contains a small tokenizer, stopword list and a controlled polar-science
vocabulary (thesaurus). The vocabulary is used for:
  * query expansion in hybrid search
  * controlled-vocabulary tagging of uploaded content
  * region / research-area classification evidence
"""
from __future__ import annotations

import re
from collections import Counter

STOPWORDS = set(
    """
    a about above after again against all also am an and any are as at be because been before being
    below between both but by can could did do does doing down during each few for from further had
    has have having he her here hers herself him himself his how i if in into is it its itself just
    me more most my myself no nor not now of off on once only or other our ours ourselves out over own
    same she should so some such than that the their theirs them themselves then there these they this
    those through to too under until up very was we were what when where which while who whom why will
    with you your yours yourself yourselves using used use based new study studies data paper report
    dataset analysis results present presents presented within across among via per may might must
    shall would one two three four five first second third et al including include includes
    show shows shown provide provides provided describe describes described record records sample
    happening happen happens affect affecting affects change changing many much well known like
    tell explain find get give about what's whats india indian
    near around along off toward towards beneath inside outside upon whose versus onto behind beyond
    near-surface several various different specific particular overall main key also however
    """.split()
)

# Words that should keep their meaning even though they are short
_TOKEN_RE = re.compile(r"[a-zA-Z][a-zA-Z0-9\-]+|\d{4}")


def normalize(text: str) -> str:
    text = text.lower()
    text = text.replace("å", "a").replace("é", "e").replace("–", "-").replace("—", "-")
    return text


def stem(token: str) -> str:
    """Very small suffix stripper (keeps the prototype dependency-free)."""
    for suf in ("ization", "ations", "ation", "ments", "ment", "ness", "ities", "ity", "ings", "ing", "ies", "es", "ed", "ly", "s"):
        if token.endswith(suf) and len(token) - len(suf) >= 4:
            if suf == "ies":
                return token[: -3] + "y"
            return token[: -len(suf)]
    return token


def tokenize(text: str, keep_stopwords: bool = False) -> list[str]:
    toks = _TOKEN_RE.findall(normalize(text))
    out = []
    for t in toks:
        t = t.strip("-")
        if not t:
            continue
        if not keep_stopwords and (t in STOPWORDS or len(t) < 3):
            continue
        out.append(t)
    return out


def stems(text: str) -> list[str]:
    return [stem(t) for t in tokenize(text)]


def split_sentences(text: str) -> list[str]:
    text = re.sub(r"\s+", " ", text or "").strip()
    if not text:
        return []
    parts = re.split(r"(?<=[.!?])\s+(?=[A-Z0-9])", text)
    return [p.strip() for p in parts if len(p.strip()) > 20]


# ─────────────────────────────────────────────────────────────
# CONTROLLED VOCABULARY
# concept -> trigger phrases (lowercase). A concept fires if any
# trigger phrase appears in the text. Concepts double as tags.
# ─────────────────────────────────────────────────────────────
VOCABULARY: dict[str, list[str]] = {
    # Regions / places
    "Antarctica": ["antarctica", "antarctic", "east antarctica", "dronning maud", "larsemann", "schirmacher", "maitri", "bharati", "dakshin gangotri", "weddell", "prydz"],
    "Arctic": ["arctic", "svalbard", "ny-alesund", "ny alesund", "kongsfjorden", "himadri", "greenland", "barents", "indarc", "boreal"],
    "Himalaya": ["himalaya", "himalayan", "himalayas", "third pole", "karakoram", "spiti", "chandra basin", "chhota shigri", "gangotri", "himansh", "hindu kush", "ladakh", "uttarakhand"],
    "Southern Ocean": ["southern ocean", "antarctic circumpolar", "polar front", "subantarctic", "sub-antarctic"],
    # Cryosphere
    "Sea Ice": ["sea ice", "sea-ice", "ice extent", "ice concentration", "pack ice", "fast ice"],
    "Ice Shelf": ["ice shelf", "ice shelves", "ice-shelf", "basal melt", "grounding line", "calving"],
    "Glaciology": ["glacier", "glaciers", "glacial", "glaciology", "ice flow", "ice sheet", "mass balance", "ice velocity", "debris cover", "ice thickness"],
    "Cryosphere": ["cryosphere", "cryospheric", "snow cover", "permafrost", "frozen ground", "snowpack", "ice", "snow"],
    "Ice Core": ["ice core", "ice cores", "firn", "isotope record", "drilling"],
    "Permafrost": ["permafrost", "rock glacier", "active layer", "frozen ground"],
    "Snow": ["snow", "snowfall", "snow accumulation", "snow cover", "snowpack", "surface mass"],
    "Sea Level": ["sea level", "sea-level", "sea level rise"],
    # Climate & atmosphere
    "Climate Change": ["climate change", "warming", "global warming", "climate variability", "climate", "temperature rise", "anthropogenic"],
    "Palaeoclimate": ["palaeoclimate", "paleoclimate", "holocene", "past climate", "sediment record", "proxy record", "isotope"],
    "Atmospheric Science": ["atmosphere", "atmospheric", "aerosol", "aerosols", "ozone", "boundary layer", "radiosonde", "weather", "meteorolog", "black carbon", "greenhouse"],
    "Ozone": ["ozone", "stratosphere", "stratospheric", "polar vortex", "uv radiation"],
    "Greenhouse Gases": ["methane", "carbon dioxide", "co2", "greenhouse gas", "ch4", "flux"],
    "Aerosols": ["aerosol", "aerosols", "black carbon", "particulate", "dust"],
    "Weather Observation": ["weather station", "automatic weather", "aws", "meteorological", "wind speed", "air temperature"],
    "Space Weather": ["geomagnetic", "geomagnetism", "ionosphere", "magnetometer", "aurora", "space weather", "solar wind"],
    # Ocean
    "Oceanography": ["ocean", "oceanography", "oceanographic", "seawater", "salinity", "ctd", "water mass", "mooring", "currents", "fjord", "hydrography"],
    "Marine Pollution": ["microplastic", "microplastics", "plastic", "pollution", "contaminant", "pollutant"],
    "Phytoplankton": ["phytoplankton", "chlorophyll", "primary productivity", "algal bloom", "bloom", "plankton"],
    "Ocean Fronts": ["polar front", "ocean front", "fronts", "frontal"],
    # Biology & ecology
    "Polar Biology": ["biology", "biodiversity", "ecosystem", "ecology", "species", "wildlife", "microbial", "microbes", "lichen", "moss", "krill", "seal", "penguin"],
    "Penguins": ["penguin", "penguins", "adelie", "emperor penguin", "colony"],
    "Krill": ["krill", "euphausia"],
    "Seabirds & Seals": ["seal", "seals", "petrel", "petrels", "seabird", "seabirds", "whale", "whales"],
    "Microbiology": ["microbial", "microbes", "bacteria", "microbiology", "cyanobacteria"],
    "Ecology": ["ecology", "ecological", "ecosystem", "bioindicator", "habitat", "food web"],
    # Earth science
    "Geology": ["geology", "geological", "rock", "sediment", "sediments", "lithology", "tectonic", "mineral", "geochemistry"],
    "Lake Sediments": ["lake sediment", "lake sediments", "lacustrine", "freshwater lake", "lakes"],
    "Hydrology": ["hydrology", "runoff", "river", "rivers", "discharge", "meltwater", "freshwater"],
    # Methods
    "Remote Sensing": ["remote sensing", "satellite", "satellites", "sentinel", "landsat", "modis", "radar", "altimetry", "imagery", "passive microwave", "sar"],
    "Field Observation": ["field survey", "field campaign", "in-situ", "in situ", "fieldwork", "field work", "observations", "observation", "monitoring"],
    "Time Series": ["time series", "time-series", "long-term", "long term", "continuous", "decadal", "multi-year", "daily", "monthly"],
    "Modelling": ["model", "modelling", "modeling", "simulation", "numerical"],
    # Programmes & logistics
    "Expedition": ["expedition", "expeditions", "voyage", "campaign", "ship", "vessel", "field season", "iae"],
    "Research Station": ["research station", "station", "base", "observatory", "laboratory"],
    "Outreach": ["outreach", "education", "students", "classroom", "public", "learners", "school"],
    "Policy": ["policy", "treaty", "governance", "antarctic treaty", "mou", "collaboration", "agreement"],
    "Monsoon": ["monsoon", "indian summer monsoon", "rainfall"],
}

# Research-area concepts used for classification (subset of vocabulary)
RESEARCH_AREAS = {
    "Glaciology": ["Glaciology", "Ice Shelf", "Ice Core", "Sea Ice", "Snow", "Cryosphere", "Permafrost"],
    "Climate Science": ["Climate Change", "Palaeoclimate", "Sea Level", "Monsoon"],
    "Atmospheric Science": ["Atmospheric Science", "Ozone", "Aerosols", "Greenhouse Gases", "Weather Observation", "Space Weather"],
    "Oceanography": ["Oceanography", "Ocean Fronts", "Phytoplankton", "Marine Pollution"],
    "Polar Biology": ["Polar Biology", "Penguins", "Microbiology", "Ecology", "Krill", "Seabirds & Seals"],
    "Geology": ["Geology", "Lake Sediments"],
    "Remote Sensing": ["Remote Sensing"],
}

REGION_CONCEPTS = {
    "Antarctica": "Antarctica",
    "Arctic": "Arctic",
    "Himalaya": "Himalaya",
    "Southern Ocean": "Southern Ocean",
}

CONTENT_TYPE_CUES = {
    "dataset": ["dataset", "data set", "time series", "csv", "netcdf", "geotiff", "measurements", "records", "variables", "temporal resolution", "spatial resolution", "gridded", "daily", "hourly", "coverage", "data product", "download"],
    "report": ["report", "assessment", "annual", "summary", "executive summary", "recommendations", "programme", "expedition report", "status report", "overview"],
    "paper": ["we ", "this study", "this paper", "our results", "we find", "we show", "hypothesis", "methodology", "discussion", "conclusion", "abstract", "journal", "investigate", "examines", "analyses", "analyzes"],
    "press_release": ["press release", "announces", "announced", "minister", "inaugurat", "ceremony", "media contact", "today"],
    "image": ["photograph", "photographs", "photo", "image collection", "gallery", "jpeg", "jpg"],
    "video": ["video", "footage", "documentary", "film", "mp4", "time-lapse"],
}


def concept_hits(text: str) -> Counter:
    """Return how many times each vocabulary concept is triggered in text."""
    t = " " + normalize(text) + " "
    hits: Counter = Counter()
    for concept, triggers in VOCABULARY.items():
        n = 0
        for trig in triggers:
            # word-boundary-ish match
            n += len(re.findall(r"(?<![a-z])" + re.escape(trig) + r"(?![a-z])", t))
        if n:
            hits[concept] = n
    return hits


def expand_query(query: str) -> tuple[list[str], list[str]]:
    """Expand a natural-language query with controlled-vocabulary concepts.

    Returns (expanded_terms, matched_concepts).
    """
    hits = concept_hits(query)
    concepts = [c for c, _ in hits.most_common()]
    extra: list[str] = []
    for c in concepts:
        extra.append(c.lower())
        # add a few close trigger phrases for recall
        for trig in VOCABULARY[c][:4]:
            if trig not in extra:
                extra.append(trig)
    return extra, concepts
