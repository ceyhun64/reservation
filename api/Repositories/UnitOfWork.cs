using api.Data;
using api.Models;

namespace api.Repositories;

public class UnitOfWork : IUnitOfWork
{
    private readonly AppDbContext _db;

    public IRepository<User> Users { get; }
    public IRepository<Provider> Providers { get; }
    public IRepository<Business> Businesses { get; }
    public IRepository<Category> Categories { get; }
    public IRepository<Service> Services { get; }
    public IRepository<TimeSlot> TimeSlots { get; }
    public IRepository<Appointment> Appointments { get; }
    public IRepository<Review> Reviews { get; }
    public IRepository<Notification> Notifications { get; }

    public UnitOfWork(AppDbContext db)
    {
        _db = db;
        Users = new Repository<User>(db);
        Providers = new Repository<Provider>(db);
        Businesses = new Repository<Business>(db);
        Categories = new Repository<Category>(db);
        Services = new Repository<Service>(db);
        TimeSlots = new Repository<TimeSlot>(db);
        Appointments = new Repository<Appointment>(db);
        Reviews = new Repository<Review>(db);
        Notifications = new Repository<Notification>(db);
    }

    public async Task<int> SaveChangesAsync() => await _db.SaveChangesAsync();

    public void Dispose() => _db.Dispose();
}
