// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

/**
 * Simple user profile class.
 */
class UserProfile {
    constructor(name, mood) {
        this.name = name || undefined;
        this.mood = mood || undefined;
    }
};

exports.UserProfile = UserProfile;
