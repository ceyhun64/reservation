using api.DTOs;
using FluentValidation;

namespace api.Validators;

public class TimeSlotCreateDtoValidator : AbstractValidator<TimeSlotCreateDto>
{
    public TimeSlotCreateDtoValidator()
    {
        RuleFor(x => x.StartTime)
            .GreaterThan(DateTime.UtcNow).WithMessage("Başlangıç zamanı gelecekte olmalıdır.");

        RuleFor(x => x.EndTime)
            .GreaterThan(x => x.StartTime).WithMessage("Bitiş zamanı başlangıçtan sonra olmalıdır.");
    }
}

public class BulkTimeSlotCreateDtoValidator : AbstractValidator<BulkTimeSlotCreateDto>
{
    public BulkTimeSlotCreateDtoValidator()
    {
        RuleFor(x => x.Date)
            .GreaterThanOrEqualTo(DateTime.UtcNow.Date).WithMessage("Tarih bugün veya sonrası olmalıdır.");

        RuleFor(x => x.WorkEnd)
            .GreaterThan(x => x.WorkStart).WithMessage("Bitiş saati başlangıçtan sonra olmalıdır.");

        RuleFor(x => x.SlotMinutes)
            .InclusiveBetween(15, 480).WithMessage("Slot süresi 15 ile 480 dakika arasında olmalıdır.");
    }
}