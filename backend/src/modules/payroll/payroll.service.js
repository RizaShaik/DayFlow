import { pool, withTransaction } from '../../config/database.js';
import { ApiError } from '../../utils/ApiError.js';
import * as repo from './payroll.repository.js';

/**
 * Component formula, per the spec: Basic = 50% of wage; HRA = 50% of Basic;
 * Standard Allowance ≈ 16.6667% of Basic; Performance Bonus = 8.33% of
 * Basic; LTA = 8.333% of Basic; PF (employee & employer) = 12% of Basic
 * each; Professional Tax = flat 200; Fixed Allowance = wage − sum(all
 * other components), so the components always foot back to the full wage.
 */
function computeComponents(monthlyWage) {
  const basic = monthlyWage * 0.5;
  const hra = basic * 0.5;
  const standardAllowance = basic * 0.166667;
  const performanceBonus = basic * 0.0833;
  const lta = basic * 0.08333;
  const pfEmployee = basic * 0.12;
  const pfEmployer = basic * 0.12;
  const professionalTax = 200;
  const fixedAllowance =
    monthlyWage - (basic + hra + standardAllowance + performanceBonus + lta);

  const round2 = (n) => Math.round(n * 100) / 100;

  return [
    { type: 'basic', computationType: 'percentage', value: 50, amount: round2(basic) },
    { type: 'hra', computationType: 'percentage', value: 50, amount: round2(hra) },
    { type: 'standard_allowance', computationType: 'percentage', value: 16.6667, amount: round2(standardAllowance) },
    { type: 'performance_bonus', computationType: 'percentage', value: 8.33, amount: round2(performanceBonus) },
    { type: 'lta', computationType: 'percentage', value: 8.333, amount: round2(lta) },
    { type: 'fixed_allowance', computationType: 'fixed', value: round2(fixedAllowance), amount: round2(fixedAllowance) },
    { type: 'pf_employee', computationType: 'percentage', value: 12, amount: round2(pfEmployee) },
    { type: 'pf_employer', computationType: 'percentage', value: 12, amount: round2(pfEmployer) },
    { type: 'professional_tax', computationType: 'fixed', value: professionalTax, amount: professionalTax },
  ];
}

export async function configureSalary(requester, employeeId, payload) {
  if (requester.role !== 'admin' && requester.role !== 'hr') {
    throw ApiError.forbidden('Only admins or HR can update salary structures');
  }

  const companyId = await repo.getEmployeeCompanyId(pool, employeeId);
  if (!companyId || companyId !== requester.companyId) {
    throw ApiError.notFound('Employee not found');
  }

  const components = computeComponents(payload.monthlyWage);

  return withTransaction(async (client) => {
    const structure = await repo.upsertSalaryStructure(client, employeeId, payload);
    await repo.replaceSalaryComponents(client, employeeId, components);

    return {
      monthlyWage: Number(structure.monthly_wage),
      workingDaysPerWeek: structure.working_days_per_week,
      breakTimeHours: Number(structure.break_time_hours),
      components,
    };
  });
}
