import { Page, Locator } from "@playwright/test";
import { fillStartPrice } from "../../utils/dropdown";

export interface CarFormData {
  vehicleControlNumber?: string;
  location?: string;
  storageStatus?: string;
  storagePool?: string;
  carAddress?: string;
  seller?: string;
  sellerControlNumber?: string;
  contractReference?: string;
  crNo?: string;
  plateNumber?: string;
  csNumber?: string;
  make?: string;
  model?: string;
  variant?: string;
  bodyType?: string;
  vehicleType?: string;
  fuelType?: string;
  transmissionType?: string;
  displacement?: string;
  numberOfWheels?: string;
  seatingCapacity?: string;
  numberOfDoors?: string;
  color?: string;
  vehicleClassification?: string;
  chassisNumber?: string;
  engineNumber?: string;
  mvFileNumber?: string;
  lastMiscTransaction?: string;
  yearModel?: string;
  ownerName?: string;
  ownerAddress?: string;
  office?: string;
  officeCode?: string;
  orNo?: string;
  dateLastRegistration?: string;
  mileage?: string;
  vehicleOwnershipStatus?: string;
  acquiredFrom?: string;
  encumberedTo?: string;
  startPrice?: string;
  minimumPrice?: string;
  estimatedArrivalDate?: string;
}

export class CarFormPage {
  readonly submitButton: Locator;
  readonly cancelButton: Locator;

  constructor(private page: Page) {
    this.submitButton = page.getByRole("button", { name: "Submit" });
    this.cancelButton = page.getByRole("button", { name: "Cancel" });
  }

  async fillTextField(id: string, value: string) {
    const field = this.page.locator(`#${id}`);
    const isReadonly = await field.getAttribute("readonly");
    if (isReadonly !== null) return;
    await field.clear();
    await field.fill(value);
  }

  async selectDropdown(id: string, value: string) {
    await this.page.locator(`#${id}`).selectOption({ label: value });
  }

  async selectSearchableDropdown(id: string, value: string) {
    const container = this.page.locator(`#${id}`).locator("..").locator(".select2-container, .chosen-container, [class*='select']");
    if (await container.count() > 0) {
      await container.click();
      await this.page.locator(".select2-search__field, .chosen-search input").fill(value);
      await this.page.locator(`.select2-results__option, .chosen-results .active-result`).filter({ hasText: value }).first().click();
    } else {
      await this.selectDropdown(id, value);
    }
  }

  async getFieldValue(id: string): Promise<string> {
    return await this.page.locator(`#${id}`).inputValue();
  }

  async getSelectedOption(id: string): Promise<string> {
    return await this.page.locator(`#${id}`).locator("option:checked").textContent() ?? "";
  }

  async fillForm(data: CarFormData) {
    if (data.vehicleControlNumber) await this.fillTextField("vehicle_control_number", data.vehicleControlNumber);
    if (data.location) await this.fillTextField("location", data.location);
    if (data.storageStatus) await this.selectDropdown("storage_status", data.storageStatus);
    if (data.storagePool) await this.selectSearchableDropdown("pool_storage_id", data.storagePool);
    if (data.carAddress) {
      await this.page.locator("#car_address").clear();
      await this.page.locator("#car_address").fill(data.carAddress);
    }
    if (data.seller) await this.selectSearchableDropdown("seller", data.seller);
    if (data.sellerControlNumber) await this.fillTextField("seller_control_number", data.sellerControlNumber);
    if (data.contractReference) await this.fillTextField("contract_reference", data.contractReference);
    if (data.crNo) await this.fillTextField("cr_no", data.crNo);
    if (data.plateNumber) await this.fillTextField("plate_number", data.plateNumber);
    if (data.csNumber) await this.fillTextField("cs_number", data.csNumber);
    if (data.make) await this.selectDropdown("make", data.make);
    if (data.model) {
      await this.page.waitForTimeout(1500);
      await this.selectDropdown("model", data.model);
    }
    if (data.variant) {
      await this.page.waitForTimeout(1500);
      await this.selectDropdown("variant", data.variant);
    }
    if (data.bodyType) await this.selectDropdown("body_type", data.bodyType);
    if (data.vehicleType) await this.selectDropdown("vehicle_type", data.vehicleType);
    if (data.fuelType) await this.selectDropdown("fuel_type", data.fuelType);
    if (data.transmissionType) await this.selectDropdown("transmission_type", data.transmissionType);
    if (data.displacement) await this.fillTextField("displacement", data.displacement);
    if (data.numberOfWheels) await this.selectDropdown("number_of_wheels", data.numberOfWheels);
    if (data.seatingCapacity) await this.selectDropdown("seating_capacity", data.seatingCapacity);
    if (data.numberOfDoors) await this.selectDropdown("number_of_doors", data.numberOfDoors);
    if (data.color) await this.selectDropdown("color", data.color);
    if (data.vehicleClassification) await this.selectDropdown("vehicle_classification", data.vehicleClassification);
    if (data.chassisNumber) await this.fillTextField("chassis_number", data.chassisNumber);
    if (data.engineNumber) await this.fillTextField("engine_number", data.engineNumber);
    if (data.mvFileNumber) await this.fillTextField("mv_file_number", data.mvFileNumber);
    if (data.lastMiscTransaction) await this.fillTextField("last_misc_transaction", data.lastMiscTransaction);
    if (data.yearModel) await this.selectSearchableDropdown("year_model", data.yearModel);
    if (data.ownerName) await this.fillTextField("owner_name", data.ownerName);
    if (data.ownerAddress) await this.fillTextField("owner_address", data.ownerAddress);
    if (data.office) await this.fillTextField("office", data.office);
    if (data.officeCode) await this.fillTextField("office_code", data.officeCode);
    if (data.orNo) await this.fillTextField("or_no", data.orNo);
    if (data.dateLastRegistration) await this.fillTextField("date_last_registration", data.dateLastRegistration);
    if (data.mileage) await this.fillTextField("mileage", data.mileage);
    if (data.vehicleOwnershipStatus) await this.fillTextField("vehicle_ownership_status", data.vehicleOwnershipStatus);
    if (data.acquiredFrom) await this.fillTextField("acquired_from", data.acquiredFrom);
    if (data.encumberedTo) await this.fillTextField("encumbered_to", data.encumberedTo);
    if (data.startPrice) await fillStartPrice(this.page, data.startPrice);
    if (data.minimumPrice) await this.fillTextField("minimum_price", data.minimumPrice);
    if (data.estimatedArrivalDate) await this.fillTextField("estimated_arrival_date", data.estimatedArrivalDate);
  }

  async submit() {
    await this.submitButton.click();
  }

  async cancel() {
    await this.cancelButton.click();
  }
}
