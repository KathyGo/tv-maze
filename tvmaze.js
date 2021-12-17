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

		shows.push({ id, name, summary, image });
	}

	return shows;
}

/** Populate shows list:
 *     - given list of shows, add shows to DOM
 */

function populateShows(shows) {
	const $showsList = $('#shows-list');
	$showsList.empty();

	for (let show of shows) {
		let $item = $(
			`<div class="col-md-6 col-lg-3 Show" data-show-id="${show.id}">
         <div class="card" data-show-id="${show.id}">
         <img class="card-img-top" src=${show.image}>  
         <div class="card-body">
             <h5 class="card-title">${show.name}</h5>
             <p class="card-text">${show.summary}</p>
             <a href="#" class="btn btn-primary">Episodes</a>
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

function populateEpisodes(episodes) {
	for (let episode of episodes) {
		const episodeItem = $(`<li>${episode.name} (season ${episode.season}, number ${episode.number})</li>`);
		$('#episodes-list').append(episodeItem);
	}

	$('#episodes-area').show();
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
		//$('#episodes-area').hide();
		let shows = await searchShows(query);
		populateShows(shows);
		$('#search-query').val('');
	});

	$('#shows-list').on('click', 'a', async function(event) {
		event.preventDefault();

		const id = $(this).closest('.card').data('show-id');
		console.log(id);
		const episodes = await getEpisodes(id);
		populateEpisodes(episodes);
	});
});
