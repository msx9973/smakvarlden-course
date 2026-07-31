import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseCSV } from "./parseCSV.ts";

describe("parseCSV", () => {
  it("parses simple single-line rows", () => {
    const csv = [
      "name,description,category,servings,selling_price",
      "Pasta Carbonara,Klassisk pasta,Huvudrätter,4,185",
    ].join("\n");

    const { headers, rows } = parseCSV(csv);
    assert.deepEqual(headers, ["name", "description", "category", "servings", "selling_price"]);
    assert.equal(rows.length, 1);
    assert.equal(rows[0].name, "Pasta Carbonara");
    assert.equal(rows[0].selling_price, "185");
  });

  it("keeps quoted multiline descriptions as one recipe row", () => {
    const csv = [
      "name,description,category,servings,selling_price",
      'Soup,"First line',
      'Second line",Huvudrätter,4,120',
      "Pasta,Simple,Huvudrätter,2,90",
    ].join("\n");

    const { rows } = parseCSV(csv);
    assert.equal(rows.length, 2);
    assert.equal(rows[0].name, "Soup");
    assert.equal(rows[0].description, "First line\nSecond line");
    assert.equal(rows[0].category, "Huvudrätter");
    assert.equal(rows[0].servings, "4");
    assert.equal(rows[0].selling_price, "120");
    assert.equal(rows[1].name, "Pasta");
    assert.equal(rows[1].selling_price, "90");
  });

  it("handles escaped quotes inside quoted fields", () => {
    const csv = 'name,description\n"Chef ""Anna"" Soup","Said ""hello"""\n';
    const { rows } = parseCSV(csv);
    assert.equal(rows.length, 1);
    assert.equal(rows[0].name, 'Chef "Anna" Soup');
    assert.equal(rows[0].description, 'Said "hello"');
  });

  it("strips a UTF-8 BOM if present", () => {
    const csv = "\uFEFFname,price\nSalt,12\n";
    const { headers, rows } = parseCSV(csv);
    assert.deepEqual(headers, ["name", "price"]);
    assert.equal(rows[0].name, "Salt");
  });
});
