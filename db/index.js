const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/clinic', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000
})
.then((mongoose) => {
    console.log('Connected to mongoose');
})
.catch((err) => {
    console.error('Error connecting to mongoose ', err);
});