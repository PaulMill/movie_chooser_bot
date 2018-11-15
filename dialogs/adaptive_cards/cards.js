const BASE_IMG_URL = 'https://image.tmdb.org/t/p/w200';

class Cards {
    async getJSON(arrayData) {
        return await arrayData.map(elData => {
            return ({
                $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
                type: "AdaptiveCard",
                version: "1.0",
                body: [
                        {
                            speak: "",
                            type: "ColumnSet",
                            columns: [
                                {
                                    type: "Column",
                                    width: 2,
                                    items: [
                                        {
                                            type: "TextBlock",
                                            text: "Movie"
                                        },
                                        {
                                            type: "TextBlock",
                                            text: `${elData.title}`,
                                            weight: "bolder",
                                            size: "extraLarge",
                                            spacing: "none"
                                        },
                                        {
                                            type: "TextBlock",
                                            text: `Vote Avarage: ${elData.vote_average}`,
                                            isSubtle: true,
                                            spacing: "none"
                                        },
                                        {
                                            type: "TextBlock",
                                            text: `Release Date: ${elData.release_date}`,
                                            isSubtle: true,
                                            spacing: "none"
                                        },
                                        {
                                            type: "TextBlock",
                                            text: `${elData.overview}`,
                                            size: "small",
                                            wrap: true
                                        }
                                    ]
                                },
                                {
                                    type: "Column",
                                    width: 2,
                                    items: [
                                        {
                                            type: "Image",
                                            url: `${BASE_IMG_URL}${elData.poster_path}`,
                                            size: "auto"
                                        }
                                    ]


                                }
                            ]
                        }
                    ],
                actions: [
                  {
                    type: "Action.OpenUrl",
                    title: "More info about movie",
                    url: `https://www.google.com/search?q=movie+${elData.title}`
                  },
                  {
                    type: "Action.OpenUrl",
                    title: "Watch trailer",
                    url: `https://www.youtube.com/results?search_query=trailer+${elData.title}`
                  }
                ]
              })
        })
    }
}
exports.Cards = Cards;