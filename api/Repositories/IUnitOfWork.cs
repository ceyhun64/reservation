using api.Models;

namespace api.Repositories;

public interface IUnitOfWork : IDisposable
{
    IRepository<User> Users { get; }
    IRepository<Provider> Providers { get; }
    IRepository<Business> Businesses { get; }
    IRepository<Category> Categories { get; }
    IRepository<Service> Services { get; }
    IRepository<TimeSlot> TimeSlots { get; }
    IRepository<Appointment> Appointments { get; }
    IRepository<Review> Reviews { get; }
    IRepository<Notification> Notifications { get; }

    Task<int> SaveChangesAsync();
}
