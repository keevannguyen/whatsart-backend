import wtf from 'wtf_wikipedia';
import crypto from 'crypto';

// Helper: Hash Function for Wikipedia Image Link
const md5Hash = (fileName) => {
  const hash = crypto.createHash('md5');
  hash.update(fileName);
  return hash.digest('hex');
};

// Helper: Get Wikipedia Image URL with md5 Hashing
const getImgUrl = (imgFileName, imgSize) => {
  const imgName = imgFileName.split(" ").join("_").split(":");
  const finalImgName = imgName[imgName.length-1];
  const firstTwo = md5Hash(finalImgName).slice(0,2);
  const url = encodeURI('https://upload.wikimedia.org/wikipedia/commons/thumb/' +
               `${firstTwo[0]}/${firstTwo}/${finalImgName}/${imgSize}px-${finalImgName}`);
  return url;
}

// Helper: Get Dimensions of Artwork
const getDimensions = (heightCM, widthCM) => {
  const dimensions = `${heightCM} cm x ${widthCM} cm (${Math.round(heightCM*0.39370*100)/100} ` +
                     `in x ${Math.round(widthCM*0.39370*100)/100} in)`;
  return dimensions;
}

// Helper: Get Artwork Details
const getArtworkDetails = (doc) => {
  const infobox = doc.infobox(0).data;
  const { title, artist, year, city, museum, height_metric, width_metric } = infobox;
  if (!title) {
    throw "Title does not exist for artwork.";
  }
  const medium = infobox.medium || infobox.material || infobox.type;
  const dimensions = height_metric && width_metric ?
                     getDimensions(height_metric.text(), width_metric.text()) : 'Not Available';
  const summary = doc.sections(0).data.sentences.slice(0,5).map((s) => s.text).join(" ");
  const artworkDetails = {
    title: title.text(),
    artist: artist ? artist.text() : 'Not Available',
    year: year ? year.text() : 'Not Available',
    city: city ? city.text() : 'Not Available',
    museum: museum ? museum.text() : 'Not Available',
    medium: medium ? medium.text() : 'Not Available',
    dimensions: dimensions,
    summary: summary,
    imgURL: infobox.image_file ? getImgUrl(infobox.image_file.text(), 800) : 'Not Available',
  };
  return artworkDetails;
}

// MAIN FUNCTION: Get Wikipedia Information for an Artwork
const getWikiInfo = (artworkName) => {
  return new Promise((resolve, reject) => {
    wtf.fetch(artworkName)
    .then((doc) => {
      return resolve(getArtworkDetails(doc));
    })
    .catch((err) => {
      //console.log('getWikiInfo ERROR:', err);
      return reject(`Server could not find wikipedia page for '${artworkName}' with error: ${err}`);
    });
  });
};

export default getWikiInfo;
