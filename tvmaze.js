/** Given a query string, return array of matching shows:
 *     { id, name, summary, episodesUrl }
 */

/** Search Shows
 *    - given a search term, search for tv shows that
 *      match that query.  The function is async show it
 *       will be returning a promise.
 *
 *   - Returns an array of objects. Each object should include
 *     following show information:
 *    {
        id: <show id>,
        name: <show name>,
        summary: <show summary>,
        image: <an image from the show data, or a default imege if no image exists, (image isn't needed until later)>
      }
 */
async function searchShows(query) {
	const res = await axios.get('http://api.tvmaze.com/search/shows', { params: { q: query } });
	const shows = [];
	for (let data of res.data) {
		const { id, name, summary } = data.show;
		const image = await searchImage(id);
		const cast = await searchCast(id);
		shows.push({ id, name, summary, image, cast });
	}

	return shows;
}

async function searchImage(id) {
	const imgRes = await axios.get(`https://api.tvmaze.com/shows/${id}/images`);
	let image = null;
	for (let data of imgRes.data) {
		if (data.resolutions.medium) {
			image = data.resolutions.medium.url;
			break;
		} else if (data.resolutions.original) {
			image = data.resolutions.original.url;
			break;
		}
	}

	if (!image) {
		image = 'https://tinyurl.com/tv-missing';
	}

	return image;
}

async function searchCast(id) {
	const castRes = await axios.get(`https://api.tvmaze.com/shows/${id}/cast`);
	const castList = [];
	for (let castdata of castRes.data) {
		castList.push(castdata.person.name);
	}

	return castList.slice(0, 5);
}

/** Populate shows list:
 *     - given list of shows, add shows to DOM
 */

function populateShows(shows) {
	const $showsList = $('#shows-list');
	$showsList.empty();

	for (let show of shows) {
		let cast = '';
		if (show.cast.length !== 0) {
			cast = `<hr>
      <p class="card-text"><b>Stars: </b>${show.cast}</p>
      <hr>`;
		}
		const id = show.id;
		const name = show.name;
		let $item = $(
			`<div class="col-md-6 col-lg-3 Show" data-show-id="${show.id}">
        <div class="card" data-show-id="${show.id}" data-show-name="${show.name}">
          <img class="card-img-top" src=${show.image}>  
          <div class="card-body">
              <h5 class="card-title">${show.name}</h5>
              <p class="card-text" id="summary">${show.summary}</p>
              ${cast}
              <!-- Button trigger modal -->
              <button type="button" class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#episodeModal-${id}">
                Episodes
              </button>
              <!-- Modal -->
              <div class="modal fade" id="episodeModal-${id}" tabindex="-1" aria-labelledby="episodeLabel-${id}" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
                  <div class="modal-content">
                    <div class="modal-header">
                      <h5 class="modal-title" id="episodeLabel-${id}">${name} Episodes</h5>
                      <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                    <ul id= "ul-${id}">
                    </ul>
                    </div>
                    <div class="modal-footer">
                      <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                    </div>
                  </div>
                </div>
              </div>
          </div>
        </div>
       </div>
      `
		);

		$showsList.append($item);
	}
}

/** Given a show ID, return list of episodes:
 *      { id, name, season, number }
 */

async function getEpisodes(id) {
	const res = await axios.get(`http://api.tvmaze.com/shows/${id}/episodes`);
	const episodes = [];
	for (let episode of res.data) {
		const { id, name, season, number } = episode;
		episodes.push({ id, name, season, number });
	}

	return episodes;
}

function populateEpisodes(id, episodes, showname, show) {
	const ulID = `#ul-${id}`;
	$(`${ulID}`).empty();
	//console.log('ul ID = ', ulID);
	if (episodes.length === 0) {
		const episodeItem = $('<li>NONE</li>');
		$(`${ulID}`).append(episodeItem);
	} else {
		for (let episode of episodes) {
			const episodeItem = $(`<li>${episode.name} (season ${episode.season}, number ${episode.number})</li>`);
			$(`${ulID}`).append(episodeItem);
		}
	}
}

/** Handle search form submission:
 *    - hide episodes area
 *    - get list of matching shows and show in shows list
 */

$(document).ready(function() {
	$('#search-form').on('submit', async function handleSearch(evt) {
		evt.preventDefault();
		let query = $('#search-query').val();
		if (!query) return;
		let shows = await searchShows(query);
		populateShows(shows);
		$('#search-query').val('');
	});

	//??? can't use $('button')
	console.log('before click on button', $('#episodeLabel').text());
	$('#shows-list').on('click', 'button', async function(event) {
		console.log('after click on button');
		event.preventDefault();
		const id = $(this).closest('.card').data('show-id');
		const showname = $(this).closest('.card').data('show-name');
		const show = $(this);
		const episodes = await getEpisodes(id);
		populateEpisodes(id, episodes, showname, show);
	});
});
