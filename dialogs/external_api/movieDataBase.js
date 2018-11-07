const BASE_URL_PICS = 'https://image.tmdb.org/t/p/w200/';
const BASE_URL_API = 'https://api.themoviedb.org/3/'
const API_KEY = process.env.tmdb_api_key;


class MovieDataBase {
    async getMovieByGenge(genre, yyyy = null) {

    }

    async apiCall(url) {
        const listMoviesResponce = await fetch(url);
        const listMoviesData = await listMoviesResponce.json();
        return {
            listMoviesData
        }
    }
}

exports.MovieDataBase = MovieDataBase;