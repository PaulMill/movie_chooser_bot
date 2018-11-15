const https = require('https');
const BASE_URL_API = 'https://api.themoviedb.org/3/'


class MovieDataBase {
    async movieByGengeURL(genre, yyyy = null) {
        const searchUrl = `${BASE_URL_API}discover/movie?api_key=${process.env.TMBD_API_KEY}&language=en-US&with_genres=${genre}&sort_by=popularity.desc`
        return searchUrl;
    }
    async movieDetailsURL(id) {
        return `${BASE_URL_API}movie/${id}?api_key=${process.env.TMBD_API_KEY}&language=en-US`
    }

    async getData(url) {
        return await new Promise((resolve, reject) => {
            const request = https.get(url, response => {
                // handle http errors
                if (response.statusCode < 200 || response.statusCode > 299) {
                    reject(new Error(`Error with loading the page. Code error: ${response.statusCode}`))
                }
                // temporary data holder
                const body = [];
                // on every content chunk, push it to the data array
                response.on('data', chunk => body.push(chunk))
                // we are done, resolve promise with those joined chunks
                response.on('end', () => resolve(JSON.parse(body.join(''))))
            })
            // handle connection errors of the request
            request.on('error', err => reject(err))
        })
    }

}

exports.MovieDataBase = MovieDataBase;