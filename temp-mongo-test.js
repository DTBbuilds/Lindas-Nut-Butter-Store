
      const mongoose = require('mongoose');
      
      async function testConnection() {
        try {
          await mongoose.connect('mongodb+srv://<username>:<password>@<cluster>.mongodb.net/lindas-nut-butter?retryWrites=true&w=majority', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
          });
          console.log('MongoDB connection successful');
          process.exit(0);
        } catch (error) {
          console.error('MongoDB connection failed:', error.message);
          process.exit(1);
        }
      }
      
      testConnection();
    