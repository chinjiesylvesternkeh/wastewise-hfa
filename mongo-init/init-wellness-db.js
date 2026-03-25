// MongoDB initialization script for Wellness Platform

// Switch to admin database for authentication
db = db.getSiblingDB('admin');

// Create databases and collections
const databases = ['wellness_gateway', 'healthcare', 'fitness', 'culinary'];

databases.forEach(dbName => {
    print(`Initializing database: ${dbName}`);
    
    const targetDb = db.getSiblingDB(dbName);
    
    // Create a dummy collection to ensure database exists
    targetDb.createCollection('_init');
    
    // Create indexes based on database type
    switch(dbName) {
        case 'wellness_gateway':
            targetDb.users.createIndex({ "email": 1 }, { unique: true });
            targetDb.users.createIndex({ "createdAt": 1 });
            print('Created indexes for wellness_gateway');
            break;
            
        case 'healthcare':
            targetDb.patients.createIndex({ "email": 1 }, { unique: true });
            targetDb.appointments.createIndex({ "patientId": 1, "appointmentDate": 1 });
            targetDb.medicalRecords.createIndex({ "patientId": 1, "visitDate": -1 });
            print('Created indexes for healthcare');
            break;
            
        case 'fitness':
            targetDb.users.createIndex({ "email": 1 }, { unique: true });
            targetDb.workouts.createIndex({ "userId": 1, "date": -1 });
            targetDb.goals.createIndex({ "userId": 1, "status": 1 });
            print('Created indexes for fitness');
            break;
            
        case 'culinary':
            targetDb.users.createIndex({ "email": 1 }, { unique: true });
            targetDb.recipes.createIndex({ "name": 1 });
            targetDb.nutritionEntries.createIndex({ "userId": 1, "date": -1 });
            print('Created indexes for culinary');
            break;
    }
    
    // Remove the dummy collection
    targetDb._init.drop();
});

print('Database initialization completed successfully!');