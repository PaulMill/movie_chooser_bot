
const { MessageFactory, CardFactory } = require('botbuilder');
const { ComponentDialog, WaterfallDialog, TextPrompt } = require('botbuilder-dialogs');

const { UserProfile } = require('./userProfile');
const { MovieDataBase } = require('../external_api/movieDataBase');
const { Cards } = require('../adaptive_cards/cards'); // to get json with cards

const NAME_LENGTH_MIN = 3;
const CARDS_TO_SHOW_CAROUSEL = 3;

// Dialog IDs
const USER_PROFILE_DIALOG = 'userProfileDialog';

// Prompt IDs
const NAME_PROMPT = 'namePrompt';
const MOOD_PROMPT = 'moodPrompt';
const MOVIE_CHOOSER_PROMPT = 'movieChooserPrompt';
const RECOM_PROMPT = 'recomPrompt';

const VALIDATION_SUCCEEDED = true;
const VALIDATION_FAILED = !VALIDATION_SUCCEEDED;

// Supported LUIS Intents.
const MOVIE_CHOOSE_INTENT = 'MovieChoose';
const MOOD_INTENT = 'Mood';
// Supported LUIS Entities.
const MOOD_POSITIVE = 'MoodPositive';
const MOOD_NEGATIVE = 'MoodNegative';


class Greeting extends ComponentDialog {
    constructor(dialogId, userProfileAccessor, luisRecognizer) {
        super(dialogId);

        // validate what was passed in
        if (!dialogId) throw ('Missing parameter.  dialogId is required');
        if (!userProfileAccessor) throw ('Missing parameter.  userProfileAccessor is required');

        // Save off our state accessor for later use
        this.userProfileAccessor = userProfileAccessor;
        this.luisRecognizer = luisRecognizer;
        this.dialogs = this.dialogs;

        this.addDialog(new WaterfallDialog(USER_PROFILE_DIALOG, [
            this.initializeStateStep.bind(this),
            this.promptForNameStep.bind(this),
            this.promptHowAreYouStep.bind(this),
            this.promptChooseMovieStep.bind(this),
            this.promptForRecommenrationStep.bind(this)
        ]));

            // Add text prompts for name and know mood
            this.addDialog(new TextPrompt(NAME_PROMPT, this.validateName));
            this.addDialog(new TextPrompt(MOOD_PROMPT));
            this.addDialog(new TextPrompt(MOVIE_CHOOSER_PROMPT));
            this.addDialog(new TextPrompt(RECOM_PROMPT));

    }

    async initializeStateStep(step) {
        let userProfile = await this.userProfileAccessor.get(step.context);
        if (userProfile === undefined) {
            if (step.options && step.options.userProfile) {
                await this.userProfileAccessor.set(step.context, step.options.userProfile);
            } else {
                await this.userProfileAccessor.set(step.context, new UserProfile());
            }
        }
        return await step.next();
    }

    async promptForNameStep(step) {
        const userProfile = await this.userProfileAccessor.get(step.context);
        // if we have everything we need, greet user and return
        if (userProfile !== undefined && userProfile.name !== undefined) {
            return await step.next(-1); // skip this promptForNameStep step
        }
        if (!userProfile.name) {
            // prompt for name, if missing
            return await step.prompt(NAME_PROMPT, 'What is your name?');
        } else {
            return await step.next();
        }
    }

    async promptHowAreYouStep(step) {
        // save name, if prompted for
        const userProfile = await this.userProfileAccessor.get(step.context);

        if (userProfile.name === undefined && step.result) {
            let lowerCaseName = step.result;
            // capitalize and set name
            userProfile.name = lowerCaseName.charAt(0).toUpperCase() + lowerCaseName.substr(1);
            await this.userProfileAccessor.set(step.context, userProfile);
        }
        return await step.prompt(MOOD_PROMPT, `Hello ${userProfile.name}, How are you today?`);
    }

    async promptChooseMovieStep(step) {
        // save name, if prompted for
        const userProfile = await this.userProfileAccessor.get(step.context);
        const resultsLUIS = await this.luisRecognizer.recognize(step.context);
        if (resultsLUIS.entities.hasOwnProperty(MOOD_POSITIVE)) {
            userProfile.mood = MOOD_POSITIVE
        } else if (resultsLUIS.entities.hasOwnProperty(MOOD_NEGATIVE)) {
            userProfile.mood = MOOD_NEGATIVE
        }
        await this.userProfileAccessor.set(step.context, userProfile);

        if (userProfile.mood === MOOD_POSITIVE) {
            await step.context.sendActivity('Good!');
            return await step.next()
        } else if (userProfile.mood === MOOD_NEGATIVE) {
            await step.context.sendActivity("I'm detecting negative sentiment, maybe some funny movie can cheer you up?");
            return await step.next()
        } else {
            return await step.next()
        }
    }
    async promptForRecommenrationStep(step) {
        step.values.movies = {}
        const userProfile = await this.userProfileAccessor.get(step.context);
        const movieDataBase = new MovieDataBase();

        if (userProfile === undefined && userProfile.mood === undefined) {
            await step.cancelAllDialogs(); // skip this promptForNameStep step
            return await step.beginDialog('Greeting');
        }

        if (userProfile.mood === MOOD_POSITIVE) {
            return await step.prompt(RECOM_PROMPT, 'I know about movies, ask me a recommendation if you want');
        } else if  (userProfile.mood === MOOD_NEGATIVE) {
            const genre = '35';
            const queryUrl = await movieDataBase.movieByGengeURL(genre);
            const cardsAdaptive = await movieDataBase.getData(queryUrl).then( res => this.getJSONCards(res)); // get data from external API, send data to create cards
            const carouselCard = await MessageFactory.carousel(cardsAdaptive);
            await step.context.sendActivity(carouselCard); // show carousel cards

            return await step.prompt(RECOM_PROMPT, 'I know about movies, ask me a recommendation if you want');
        }
    }

    //Validator function to verify that user name meets required constraints.
    async validateName(validatorContext) {
        // Validate that the user entered a minimum length for their name
        const value = (validatorContext.recognized.value || '').trim();
        if (value.length >= NAME_LENGTH_MIN) {
            return VALIDATION_SUCCEEDED;
        } else {
            await validatorContext.context.sendActivity(`Names need to be at least ${ NAME_LENGTH_MIN } characters long.`);
            return VALIDATION_FAILED;
        }
    }

    async getJSONCards(data) {
        let resultArr = data.results; // array of search results from external API
        let indexStart = 0; // if array less than cards need to show on carousel
        if(resultArr.length > CARDS_TO_SHOW_CAROUSEL) {
            indexStart = Math.floor(Math.random()*Math.floor(resultArr.length - 1 - CARDS_TO_SHOW_CAROUSEL)); // get random index starting splice
        }
        const splisedArr = resultArr.splice(indexStart, CARDS_TO_SHOW_CAROUSEL);
        const cards = new Cards(); // initiate object
        const cardsArrJSON = await cards.getJSON(splisedArr); // get array of cards
        return await cardsArrJSON.map( cardJSON => CardFactory.adaptiveCard(cardJSON));// create array of cards
    }


    // async greetUser(step) {
    //     const userProfile = await this.userProfileAccessor.get(step.context);
    //     // Display to the user their profile information and end dialog
    //     await step.context.sendActivity(`Hi ${ userProfile.name }, from ${ userProfile.city }, nice to meet you!`);
    //     return await step.endDialog();
    // }
}

exports.GreetingDialog = Greeting;
