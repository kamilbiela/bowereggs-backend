var eggSchema = new Schema({
    name: String,
    url: String
});

var Egg = mongoose.model('Egg', eggSchema);

module.exports = Egg;