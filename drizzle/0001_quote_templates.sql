CREATE TABLE IF NOT EXISTS "quote_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"category" varchar(200) NOT NULL,
	"title" varchar(500) NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"sortOrder" integer DEFAULT 0 NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "quote_templates_category_unique" UNIQUE("category")
);

INSERT INTO "quote_templates" ("category", "title", "description", "sortOrder")
VALUES
	('Inverter', 'Inverter 06KW Hybrid IP66', '(Hybrid Inverter 06KW SOLIS)', 10),
	('Solar Panels', 'Panels 620W Mono Perc', '(World No .1, Tier 1 Bloomberg certified Solar Panel IEC 61215: 2005 TUV Certifications. TCL Solar /JINKO Solar / Canadian Solar or equivalent, depending upon stock availability)', 20),
	('Structure', 'Weather Protected Frames', '(Customized Structure uplifted)', 30),
	('Wires', 'Imported Flexible electric wire', 'for System interconnections 1) PV Module Interconnections 2) Module to Controller 3) DC Wires', 40),
	('Batteries', 'Power Bank Lithium Ion', '(Lithium Ion Battery 5.12KWH PYLON TECH)', 50),
	('Balance of System', 'Circuit Breakers & Combiner Box', '(Circuit Breakers /SDPDs/Fuses for equipment protection and safety with Photo Voltaic modules combiner boxed with rated DC Circuit Breakers for series and parallel connections for PV Module)', 60),
	('Installation', 'Installation Service Charges', '(Installation, Testing and Commissioning of Solar Power System)', 70),
	('Transportation', 'Transportation Charges', '', 80),
	('Other', 'Fitting Nut Bolt', '(Mc4 Connectors, Nut Bolt, Cable Ties, PVC duct, Cable Tray)', 90)
ON CONFLICT ("category") DO NOTHING;
