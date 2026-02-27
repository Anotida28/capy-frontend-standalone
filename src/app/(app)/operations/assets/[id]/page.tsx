"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import PageHeader from "@/components/layout/page-header";
import { PageShell } from "@/components/layout/page-shell";
import { SectionCard } from "@/components/layout/section-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/modal";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Table, TableRoot } from "@/components/ui/table";
import { AssetForm } from "@/features/operations/assets/components/asset-form";
import {
  useAsset,
  useUpdateAsset,
  useDeleteAsset,
  useAssetMedia,
  useCreateAssetMedia,
  useDeleteAssetMedia
} from "@/features/operations/assets/hooks";
import type { Asset, AssetMedia } from "@/features/operations/assets/types";
import { formatDate } from "@/lib/utils/date";
import { formatMoney } from "@/lib/utils/money";
import { getStatusTone } from "@/lib/utils/status-tone";
import { useCanEdit } from "@/lib/auth/require-role";
import { useToast } from "@/components/ui/toast";

const CATEGORY_LABELS: Record<string, string> = {
  HEAVY_EQUIPMENT: "Heavy Equipment",
  SMALL_EQUIPMENT: "Small Equipment",
  TOOLS: "Tools",
  VEHICLES: "Vehicles",
  VEHICLE: "Vehicles",
  TOOL: "Tools",
  PLANT: "Small Equipment",
  OTHER: "Small Equipment"
};

const formatCategory = (category?: Asset["category"] | null) => {
  if (!category) return "-";
  return CATEGORY_LABELS[category] ?? category;
};

const formatPeriod = (start?: string | null, end?: string | null) => {
  if (!start && !end) return "-";
  return `${start ? formatDate(start) : "Start not set"} → ${end ? formatDate(end) : "Open"}`;
};

export default function AssetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = (params?.id as string) ?? "";
  const assetQuery = useAsset(id);
  const updateAsset = useUpdateAsset();
  const deleteAsset = useDeleteAsset();
  const mediaQuery = useAssetMedia(id);
  const createMedia = useCreateAssetMedia();
  const deleteMedia = useDeleteAssetMedia();
  const canEdit = useCanEdit();
  const { notify } = useToast();

  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [showService, setShowService] = useState(false);
  const [showLocation, setShowLocation] = useState(false);
  const [showMedia, setShowMedia] = useState(false);
  const [assignValues, setAssignValues] = useState({
    assignedProjectId: "",
    assignedProjectName: "",
    personInChargeId: "",
    personInChargeName: "",
    allocationStartDate: "",
    allocationEndDate: "",
    rentalStartDate: "",
    rentalEndDate: "",
    availability: "",
    ownership: ""
  });
  const [serviceValues, setServiceValues] = useState({
    lastServiceDate: "",
    nextServiceDate: "",
    engineHours: "",
    condition: ""
  });
  const [locationValue, setLocationValue] = useState("");
  const [mediaValues, setMediaValues] = useState<AssetMedia>({
    assetId: id,
    mediaUrl: "",
    mediaType: "PHOTO",
    description: "",
    capturedAt: ""
  });

  const asset = assetQuery.data;

  const availabilityTone = (availability?: Asset["availability"] | null) => {
    if (!availability) return "pending";
    if (availability === "AVAILABLE") return "approved";
    if (availability === "IN_USE") return "planning";
    return "on_hold";
  };

  const conditionTone = (condition?: Asset["condition"] | null) => {
    if (!condition) return "pending";
    if (condition === "GOOD") return "approved";
    if (condition === "FAIR") return "planning";
    return "rejected";
  };

  const handleEdit = async (values: Asset) => {
    if (!asset?.id) return;
    try {
      await updateAsset.mutateAsync({ id: asset.id, payload: values });
      notify({ message: "Asset updated", tone: "success" });
      setShowEdit(false);
    } catch {
      notify({ message: "Unable to update asset", tone: "error" });
    }
  };

  const handleQuickUpdate = async (patch: Partial<Asset>, message: string) => {
    if (!asset?.id) return;
    try {
      await updateAsset.mutateAsync({ id: asset.id, payload: { ...asset, ...patch } });
      notify({ message, tone: "success" });
    } catch {
      notify({ message: "Unable to update asset", tone: "error" });
    }
  };

  const handleDelete = async () => {
    if (!asset?.id) return;
    try {
      await deleteAsset.mutateAsync(asset.id);
      notify({ message: "Asset deleted", tone: "success" });
      router.push("/assets");
    } catch {
      notify({ message: "Unable to delete asset", tone: "error" });
    } finally {
      setShowDelete(false);
    }
  };

  useEffect(() => {
    if (!asset) return;
    setAssignValues({
      assignedProjectId: asset.assignedProjectId ?? "",
      assignedProjectName: asset.assignedProjectName ?? "",
      personInChargeId: asset.personInChargeId ?? asset.operatorId ?? "",
      personInChargeName: asset.personInChargeName ?? "",
      allocationStartDate: asset.allocationStartDate ?? "",
      allocationEndDate: asset.allocationEndDate ?? "",
      rentalStartDate: asset.rentalStartDate ?? "",
      rentalEndDate: asset.rentalEndDate ?? "",
      availability: asset.availability ?? "",
      ownership: asset.ownership ?? ""
    });
    setServiceValues({
      lastServiceDate: asset.lastServiceDate ?? "",
      nextServiceDate: asset.nextServiceDate ?? "",
      engineHours: asset.engineHours != null ? String(asset.engineHours) : "",
      condition: asset.condition ?? ""
    });
    setLocationValue(asset.currentLocationWkt ?? "");
    setMediaValues((prev) => ({ ...prev, assetId: asset.id }));
  }, [asset]);

  if (assetQuery.isLoading) return <Skeleton className="surface-card" />;
  if (assetQuery.error || !asset) return <ErrorState message="Unable to load asset." />;

  return (
    <PageShell>
      <PageHeader
        title={`Asset ${asset.assetCode}`}
        subtitle={`${asset.type ?? formatCategory(asset.category)} • ${asset.status ?? "Status"}`}
        actions={
          canEdit ? (
            <div className="toolbar">
              <Button variant="ghost" onClick={() => setShowEdit(true)}>Edit</Button>
              <Button variant="ghost" onClick={() => setShowDelete(true)}>Delete</Button>
            </div>
          ) : null
        }
      />

      <SectionCard>
        <div className="section-header">
          <h2>Quick Actions</h2>
          <p className="muted">Fast updates for assignments, maintenance, and location.</p>
        </div>
        {canEdit ? (
          <div className="toolbar">
            <Button variant="ghost" onClick={() => setShowAssign(true)}>Assign / Allocate</Button>
            <Button variant="ghost" onClick={() => setShowService(true)}>Log Service</Button>
            <Button variant="ghost" onClick={() => setShowLocation(true)}>Update Location</Button>
            <Button variant="ghost" onClick={() => handleQuickUpdate({ availability: "AVAILABLE" }, "Marked available")}>
              Mark Available
            </Button>
            <Button variant="ghost" onClick={() => handleQuickUpdate({ availability: "IN_USE" }, "Marked in use")}>
              Mark In Use
            </Button>
            <Button
              variant="ghost"
              onClick={() => handleQuickUpdate({ availability: "MAINTENANCE", status: "UNDER_REPAIR" }, "Sent to maintenance")}
            >
              Send to Maintenance
            </Button>
          </div>
        ) : (
          <p className="muted">Quick actions are available to operations directors.</p>
        )}
      </SectionCard>

      <SectionCard>
        <div className="section-header">
          <h2>Overview</h2>
          <p className="muted">Identification and asset classification.</p>
        </div>
        <div className="form-grid large">
          <div>
            <p className="muted">Asset Code</p>
            <p className="table-title">{asset.assetCode}</p>
          </div>
          <div>
            <p className="muted">Status</p>
            {asset.status ? <Badge label={asset.status} tone={getStatusTone(asset.status)} /> : "-"}
          </div>
          <div>
            <p className="muted">Category</p>
            <p className="table-title">{formatCategory(asset.category)}</p>
          </div>
          <div>
            <p className="muted">Availability</p>
            {asset.availability ? <Badge label={asset.availability} tone={availabilityTone(asset.availability)} /> : "-"}
          </div>
          <div>
            <p className="muted">Type</p>
            <p className="table-title">{asset.type ?? "-"}</p>
          </div>
          <div>
            <p className="muted">Make</p>
            <p className="table-title">{asset.make ?? "-"}</p>
          </div>
          <div>
            <p className="muted">Model</p>
            <p className="table-title">{asset.model ?? "-"}</p>
          </div>
          <div>
            <p className="muted">Year</p>
            <p className="table-title">{asset.year ?? "-"}</p>
          </div>
          <div>
            <p className="muted">Serial Number</p>
            <p className="table-title">{asset.serialNumber ?? "-"}</p>
          </div>
          <div>
            <p className="muted">VIN</p>
            <p className="table-title">{asset.vin ?? "-"}</p>
          </div>
        </div>
      </SectionCard>

      <SectionCard>
        <div className="section-header">
          <h2>Assignment & Location</h2>
          <p className="muted">Allocation ownership, rental period, and current location.</p>
        </div>
        <div className="form-grid large">
          <div>
            <p className="muted">Assigned Project</p>
            <p className="table-title">{asset.assignedProjectName ?? asset.assignedProjectId ?? "-"}</p>
            {asset.assignedProjectId ? (
              <Button variant="ghost" onClick={() => router.push(`/projects/${asset.assignedProjectId}`)}>
                View Project
              </Button>
            ) : null}
          </div>
          <div>
            <p className="muted">Person in Charge</p>
            <p className="table-title">{asset.personInChargeName ?? asset.personInChargeId ?? asset.operatorId ?? "-"}</p>
          </div>
          <div>
            <p className="muted">Allocation Period</p>
            <p className="table-title">{formatPeriod(asset.allocationStartDate, asset.allocationEndDate)}</p>
          </div>
          <div>
            <p className="muted">Rental Period</p>
            <p className="table-title">{formatPeriod(asset.rentalStartDate, asset.rentalEndDate)}</p>
          </div>
          <div>
            <p className="muted">Telematics ID</p>
            <p className="table-title">{asset.telematicsId ?? "-"}</p>
          </div>
          <div>
            <p className="muted">Current Location (WKT)</p>
            <p className="table-title">{asset.currentLocationWkt ?? "-"}</p>
          </div>
        </div>
      </SectionCard>

      <SectionCard>
        <div className="section-header">
          <h2>Utilization & Maintenance</h2>
          <p className="muted">Usage, servicing, and condition.</p>
        </div>
        <div className="form-grid large">
          <div>
            <p className="muted">Engine Hours</p>
            <p className="table-title">{asset.engineHours ?? "-"}</p>
          </div>
          <div>
            <p className="muted">Utilization %</p>
            <p className="table-title">{asset.utilizationPercent != null ? `${asset.utilizationPercent}%` : "-"}</p>
          </div>
          <div>
            <p className="muted">Last Service</p>
            <p className="table-title">{formatDate(asset.lastServiceDate)}</p>
          </div>
          <div>
            <p className="muted">Next Service</p>
            <p className="table-title">{formatDate(asset.nextServiceDate)}</p>
          </div>
          <div>
            <p className="muted">Service Interval</p>
            <p className="table-title">{asset.serviceIntervalHours != null ? `${asset.serviceIntervalHours} hrs` : "-"}</p>
          </div>
          <div>
            <p className="muted">Condition</p>
            {asset.condition ? <Badge label={asset.condition} tone={conditionTone(asset.condition)} /> : "-"}
          </div>
        </div>
      </SectionCard>

      <SectionCard>
        <div className="section-header">
          <h2>Financials</h2>
          <p className="muted">Ownership and procurement details.</p>
        </div>
        <div className="form-grid large">
          <div>
            <p className="muted">Ownership</p>
            <p className="table-title">{asset.ownership ?? "-"}</p>
          </div>
          <div>
            <p className="muted">Purchase Date</p>
            <p className="table-title">{formatDate(asset.purchaseDate)}</p>
          </div>
          <div>
            <p className="muted">Purchase Cost</p>
            <p className="table-title">{formatMoney(asset.purchaseCost)}</p>
          </div>
          <div>
            <p className="muted">Supplier</p>
            <p className="table-title">{asset.supplierId ?? "-"}</p>
          </div>
        </div>
      </SectionCard>

      <SectionCard>
        <div className="section-header">
          <h2>Notes</h2>
          <p className="muted">Additional context.</p>
        </div>
        <p className="table-title">{asset.notes ?? "No notes available."}</p>
      </SectionCard>

      <SectionCard>
        <div className="section-header">
          <h2>Asset Media</h2>
          <p className="muted">Photos, inspections, and documents.</p>
        </div>
        {canEdit ? (
          <div style={{ marginBottom: "1rem" }}>
            <Button variant="ghost" onClick={() => setShowMedia(true)}>Add Media</Button>
          </div>
        ) : null}
        {mediaQuery.isLoading ? (
          <Skeleton className="surface-card" />
        ) : mediaQuery.error ? (
          <ErrorState message="Unable to load media." onRetry={() => mediaQuery.refetch()} />
        ) : mediaQuery.data && mediaQuery.data.length > 0 ? (
          <Table>
            <TableRoot>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Description</th>
                  <th>Captured</th>
                  <th>Link</th>
                  {canEdit ? <th className="actions-cell">Actions</th> : null}
                </tr>
              </thead>
              <tbody>
                {mediaQuery.data.map((media) => (
                  <tr key={media.id ?? media.mediaUrl}>
                    <td><Badge label={media.mediaType} tone="planning" /></td>
                    <td>{media.description ?? "-"}</td>
                    <td>{formatDate(media.capturedAt)}</td>
                    <td>
                      <a href={media.mediaUrl} target="_blank" rel="noreferrer" className="table-title">
                        View media →
                      </a>
                    </td>
                    {canEdit ? (
                      <td className="actions-cell">
                        <Button
                          variant="ghost"
                          onClick={() => media.id && deleteMedia.mutate({ id: media.id, assetId: asset.id })}
                        >
                          Delete
                        </Button>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </TableRoot>
          </Table>
        ) : (
          <EmptyState title="No media uploaded" description="Attach photos or documents to this asset." />
        )}
      </SectionCard>

      <AssetForm
        open={showEdit}
        initialValues={asset}
        onSubmit={handleEdit}
        onClose={() => setShowEdit(false)}
        isSubmitting={updateAsset.isPending}
      />

      <Modal open={showAssign} title="Assign / Allocate Asset" onClose={() => setShowAssign(false)}>
        <ModalBody>
          <div className="form-grid">
            <FormField label="Assigned Project ID" htmlFor="assign-project-id">
              <Input
                id="assign-project-id"
                value={assignValues.assignedProjectId}
                onChange={(event) => setAssignValues((prev) => ({ ...prev, assignedProjectId: event.target.value }))}
              />
            </FormField>
            <FormField label="Assigned Project Name" htmlFor="assign-project-name">
              <Input
                id="assign-project-name"
                value={assignValues.assignedProjectName}
                onChange={(event) => setAssignValues((prev) => ({ ...prev, assignedProjectName: event.target.value }))}
              />
            </FormField>
            <FormField label="Person in Charge (Staff ID)" htmlFor="assign-person-in-charge-id">
              <Input
                id="assign-person-in-charge-id"
                value={assignValues.personInChargeId}
                onChange={(event) => setAssignValues((prev) => ({ ...prev, personInChargeId: event.target.value }))}
              />
            </FormField>
            <FormField label="Person in Charge Name" htmlFor="assign-person-in-charge-name">
              <Input
                id="assign-person-in-charge-name"
                value={assignValues.personInChargeName}
                onChange={(event) => setAssignValues((prev) => ({ ...prev, personInChargeName: event.target.value }))}
              />
            </FormField>
            <FormField label="Allocation Start" htmlFor="assign-allocation-start">
              <Input
                id="assign-allocation-start"
                type="date"
                value={assignValues.allocationStartDate}
                onChange={(event) => setAssignValues((prev) => ({ ...prev, allocationStartDate: event.target.value }))}
              />
            </FormField>
            <FormField label="Allocation End" htmlFor="assign-allocation-end">
              <Input
                id="assign-allocation-end"
                type="date"
                value={assignValues.allocationEndDate}
                onChange={(event) => setAssignValues((prev) => ({ ...prev, allocationEndDate: event.target.value }))}
              />
            </FormField>
            <FormField label="Ownership" htmlFor="assign-ownership">
              <select
                id="assign-ownership"
                value={assignValues.ownership}
                onChange={(event) => setAssignValues((prev) => ({ ...prev, ownership: event.target.value }))}
              >
                <option value="">Not set</option>
                {["OWNED", "LEASED", "RENTED"].map((value) => (
                  <option key={value} value={value}>{value}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Rental Start" htmlFor="assign-rental-start">
              <Input
                id="assign-rental-start"
                type="date"
                value={assignValues.rentalStartDate}
                onChange={(event) => setAssignValues((prev) => ({ ...prev, rentalStartDate: event.target.value }))}
              />
            </FormField>
            <FormField label="Rental End" htmlFor="assign-rental-end">
              <Input
                id="assign-rental-end"
                type="date"
                value={assignValues.rentalEndDate}
                onChange={(event) => setAssignValues((prev) => ({ ...prev, rentalEndDate: event.target.value }))}
              />
            </FormField>
            <FormField label="Availability" htmlFor="assign-availability">
              <select
                id="assign-availability"
                value={assignValues.availability}
                onChange={(event) => setAssignValues((prev) => ({ ...prev, availability: event.target.value }))}
              >
                <option value="">Not set</option>
                {["AVAILABLE", "IN_USE", "MAINTENANCE"].map((value) => (
                  <option key={value} value={value}>{value}</option>
                ))}
              </select>
            </FormField>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setShowAssign(false)}>Cancel</Button>
          <Button
            onClick={() => {
              handleQuickUpdate(
                {
                  assignedProjectId: assignValues.assignedProjectId || null,
                  assignedProjectName: assignValues.assignedProjectName || null,
                  personInChargeId: assignValues.personInChargeId || null,
                  personInChargeName: assignValues.personInChargeName || null,
                  operatorId: assignValues.personInChargeId || null,
                  allocationStartDate: assignValues.allocationStartDate || null,
                  allocationEndDate: assignValues.allocationEndDate || null,
                  ownership: assignValues.ownership ? (assignValues.ownership as Asset["ownership"]) : null,
                  rentalStartDate: assignValues.rentalStartDate || null,
                  rentalEndDate: assignValues.rentalEndDate || null,
                  availability: assignValues.availability ? (assignValues.availability as Asset["availability"]) : null
                },
                "Allocation details updated"
              );
              setShowAssign(false);
            }}
            disabled={updateAsset.isPending}
          >
            {updateAsset.isPending ? "Saving..." : "Save"}
          </Button>
        </ModalFooter>
      </Modal>

      <Modal open={showService} title="Log Service" onClose={() => setShowService(false)}>
        <ModalBody>
          <div className="form-grid">
            <FormField label="Engine Hours" htmlFor="service-engine-hours">
              <Input
                id="service-engine-hours"
                type="number"
                value={serviceValues.engineHours}
                onChange={(event) => setServiceValues((prev) => ({ ...prev, engineHours: event.target.value }))}
              />
            </FormField>
            <FormField label="Last Service Date" htmlFor="service-last">
              <Input
                id="service-last"
                type="date"
                value={serviceValues.lastServiceDate}
                onChange={(event) => setServiceValues((prev) => ({ ...prev, lastServiceDate: event.target.value }))}
              />
            </FormField>
            <FormField label="Next Service Date" htmlFor="service-next">
              <Input
                id="service-next"
                type="date"
                value={serviceValues.nextServiceDate}
                onChange={(event) => setServiceValues((prev) => ({ ...prev, nextServiceDate: event.target.value }))}
              />
            </FormField>
            <FormField label="Condition" htmlFor="service-condition">
              <select
                id="service-condition"
                value={serviceValues.condition}
                onChange={(event) => setServiceValues((prev) => ({ ...prev, condition: event.target.value }))}
              >
                <option value="">Not set</option>
                {["GOOD", "FAIR", "POOR"].map((value) => (
                  <option key={value} value={value}>{value}</option>
                ))}
              </select>
            </FormField>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setShowService(false)}>Cancel</Button>
          <Button
            onClick={() => {
              handleQuickUpdate(
                {
                  engineHours: serviceValues.engineHours ? Number(serviceValues.engineHours) : null,
                  lastServiceDate: serviceValues.lastServiceDate || null,
                  nextServiceDate: serviceValues.nextServiceDate || null,
                  condition: serviceValues.condition ? (serviceValues.condition as Asset["condition"]) : null
                },
                "Service log updated"
              );
              setShowService(false);
            }}
            disabled={updateAsset.isPending}
          >
            {updateAsset.isPending ? "Saving..." : "Save"}
          </Button>
        </ModalFooter>
      </Modal>

      <Modal open={showLocation} title="Update Location" onClose={() => setShowLocation(false)}>
        <ModalBody>
          <div className="form-grid">
            <FormField label="Current Location (WKT)" htmlFor="asset-location">
              <Input
                id="asset-location"
                value={locationValue}
                onChange={(event) => setLocationValue(event.target.value)}
              />
            </FormField>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setShowLocation(false)}>Cancel</Button>
          <Button
            onClick={() => {
              handleQuickUpdate({ currentLocationWkt: locationValue || null }, "Location updated");
              setShowLocation(false);
            }}
            disabled={updateAsset.isPending}
          >
            {updateAsset.isPending ? "Saving..." : "Save"}
          </Button>
        </ModalFooter>
      </Modal>

      <Modal open={showMedia} title="Add Asset Media" onClose={() => setShowMedia(false)}>
        <ModalBody>
          <div className="form-grid">
            <FormField label="Media URL" htmlFor="asset-media-url">
              <Input
                id="asset-media-url"
                value={mediaValues.mediaUrl}
                onChange={(event) => setMediaValues((prev) => ({ ...prev, mediaUrl: event.target.value }))}
              />
            </FormField>
            <FormField label="Media Type" htmlFor="asset-media-type">
              <select
                id="asset-media-type"
                value={mediaValues.mediaType}
                onChange={(event) =>
                  setMediaValues((prev) => ({ ...prev, mediaType: event.target.value as AssetMedia["mediaType"] }))
                }
              >
                {["PHOTO", "VIDEO", "DOCUMENT", "OTHER"].map((value) => (
                  <option key={value} value={value}>{value}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Captured At" htmlFor="asset-media-captured">
              <Input
                id="asset-media-captured"
                type="date"
                value={mediaValues.capturedAt ?? ""}
                onChange={(event) => setMediaValues((prev) => ({ ...prev, capturedAt: event.target.value }))}
              />
            </FormField>
            <FormField label="Description" htmlFor="asset-media-description" className="full-width">
              <Input
                id="asset-media-description"
                value={mediaValues.description ?? ""}
                onChange={(event) => setMediaValues((prev) => ({ ...prev, description: event.target.value }))}
              />
            </FormField>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setShowMedia(false)}>Cancel</Button>
          <Button
            onClick={async () => {
              if (!mediaValues.mediaUrl) return;
              try {
                await createMedia.mutateAsync({ ...mediaValues, assetId: asset.id });
                notify({ message: "Media added", tone: "success" });
                setShowMedia(false);
                setMediaValues({ assetId: asset.id, mediaUrl: "", mediaType: "PHOTO", description: "", capturedAt: "" });
              } catch {
                notify({ message: "Unable to add media", tone: "error" });
              }
            }}
            disabled={createMedia.isPending}
          >
            {createMedia.isPending ? "Saving..." : "Add Media"}
          </Button>
        </ModalFooter>
      </Modal>

      <ConfirmDialog
        open={showDelete}
        title="Delete asset?"
        description="This action cannot be undone."
        confirmLabel="Delete"
        confirmTone="destructive"
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
      />
    </PageShell>
  );
}
