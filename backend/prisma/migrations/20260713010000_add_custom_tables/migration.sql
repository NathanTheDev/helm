-- CreateTable
CREATE TABLE "CustomTable" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "position" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomTable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomField" (
    "id" TEXT NOT NULL,
    "tableId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "position" DOUBLE PRECISION NOT NULL,
    "config" JSONB,
    "defaultValue" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomField_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomRow" (
    "id" TEXT NOT NULL,
    "tableId" TEXT NOT NULL,
    "values" JSONB NOT NULL,
    "position" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomRow_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CustomTable_userId_idx" ON "CustomTable"("userId");

-- CreateIndex
CREATE INDEX "CustomField_tableId_idx" ON "CustomField"("tableId");

-- CreateIndex
CREATE INDEX "CustomRow_tableId_idx" ON "CustomRow"("tableId");

-- AddForeignKey
ALTER TABLE "CustomField" ADD CONSTRAINT "CustomField_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "CustomTable"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomRow" ADD CONSTRAINT "CustomRow_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "CustomTable"("id") ON DELETE CASCADE ON UPDATE CASCADE;
