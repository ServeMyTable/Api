const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const feedbackSchema = new Schema({

    RestaurantID:String,
    Name:String,
    stars:Number,
    feedback: String

});
const Feedback = mongoose.model('Feedback',feedbackSchema);

module.exports = Feedback;